import express from 'express';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import csrf from 'csrf';
import pool from '../config/db.js'; // --- DB CHANGE --- Import the connection pool
import { validateFormInput, validateRequestDemoInput } from '../middleware/inputValidation.js';
import { sendEmailWithRetry } from '../utils/emailRetry.js';
import { getEmailRecipient } from '../utils/emailConfig.js';
import he from 'he';
// amazonq-ignore-next-line
const router = express.Router();

// CSRF protection configuration
const CSRF_SECRET = process.env.CSRF_SECRET;
if (!CSRF_SECRET) {
  const errorMsg = 'CSRF_SECRET environment variable is not set. This is required in all environments for CSRF protection.';
  console.error(`[SECURITY] ${errorMsg}`);
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMsg);
  }
}

const tokens = new csrf(CSRF_SECRET);

// Rate limiting to prevent abuse
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Stricter rate limiting for contact forms
const contactLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // limit each IP to 3 contact requests per 5 minutes
    message: 'Too many contact requests from this IP, please try again after 5 minutes'
});

// Stricter rate limiting for demo requests
const demoLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 2, // limit each IP to 2 demo requests per 10 minutes
    message: 'Too many demo requests from this IP, please try again after 10 minutes'
});

// Apply general rate limiting to all routes
router.use(generalLimiter);

// CSRF token endpoint - intentionally public for form submissions
// No authorization required as this provides tokens for public forms
router.get('/csrf-token', (req, res) => {
    const token = tokens.create(CSRF_SECRET);
    res.json({ csrfToken: token });
});

// CSRF validation middleware
const validateCSRF = (req, res, next) => {
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    if (!token || !tokens.verify(CSRF_SECRET, token)) {
        console.warn('CSRF validation failed', {
            path: req.path,
            ip: req.ip,
            origin: req.headers.origin,
            referer: req.headers.referer,
        });
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
};

// Origin validation middleware for form submissions
const validateOrigin = (req, res, next) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim());
    const origin = req.headers.origin || req.headers.referer || '';
    
    // Use exact matching to prevent bypass attacks
    // (e.g., http://localhost:5173.evil.com would bypass startsWith check)
    if (!allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: 'Unauthorized origin' });
    }
    next();
};



// 1. Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: true
    }
});

// Use he library for robust HTML escaping
const escapeHTML = (str) => {
    if (!str) return str;
    return he.encode(str);
};

// 2. Route for the Contact Form - intentionally public for website visitors
// CSRF protection and origin validation provide security for this use case
router.post(
    '/contact',
    contactLimiter,
    validateOrigin,
    validateCSRF,
    validateFormInput,
    [
        body('firstName', 'First name is required').notEmpty().trim().escape(),
        body('lastName', 'Last name is required').notEmpty().trim().escape(),
        body('email', 'Please include a valid email').isEmail().normalizeEmail(),
        body('message', 'Message is required and must be under 2000 characters').notEmpty().isLength({ max: 2000 }).trim().escape(),
        body('phone').optional({ checkFalsy: true }).matches(/^[\d\s-()+.]{10,20}$/).withMessage('Invalid phone number format').trim().escape(),
        body('companyName').optional({ checkFalsy: true }).trim().escape(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { firstName, lastName, email, phone, companyName, message } = req.body;

        let dbSuccess = false;
        let dbErrorMessage = '';

        // --- 1. Attempt to save to the database ---
        try {
            const dbQuery = 'INSERT INTO contact_submissions (first_name, last_name, email, phone, company_name, message) VALUES (?, ?, ?, ?, ?, ?)';
            await pool.query(dbQuery, [firstName, lastName, email, phone, companyName, message]);
            dbSuccess = true;
        } catch (dbError) {
            console.error('DATABASE INSERT FAILED for /contact:', { 
                error: dbError.message,
                code: dbError.code,
                errno: dbError.errno 
            });
            dbErrorMessage = dbError.message;
            dbSuccess = false;
        }

        // --- 2. Construct email with DB status and send it ---
        const dbStatusLine = dbSuccess
            ? '<p><strong>Database Status:</strong> <span style="color:green;">Successfully saved.</span></p>'
            : `<p><strong>Database Status:</strong> <span style="color:red;">FAILED.</span><br><strong>Error:</strong> ${process.env.NODE_ENV === 'production' ? 'A database error occurred.' : escapeHTML(dbErrorMessage)}</p>`;

        const recipientEmail = await getEmailRecipient('contact');
        const mailOptions = {
            from: `"ChexPro Website" <${escapeHTML(process.env.SMTP_USER)}>`,
            to: escapeHTML(recipientEmail),
            subject: dbSuccess ? 'New Contact Form Submission' : '⚠️ ACTION REQUIRED: Contact Form DB Save Failed',
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${escapeHTML(firstName)} ${escapeHTML(lastName)}</p>
                <p><strong>Email:</strong> ${escapeHTML(email)}</p>
                <p><strong>Phone:</strong> ${escapeHTML(phone) || 'N/A'}</p>
                <p><strong>Company:</strong> ${escapeHTML(companyName) || 'N/A'}</p>
                <p><strong>Message:</strong></p>
                <p>${escapeHTML(message)}</p>
                <hr>
                ${dbStatusLine}
            `,
        };

        try {
            await sendEmailWithRetry(transporter, mailOptions, 3);
        } catch (emailError) {
            // This is the worst case: DB may have failed AND email failed. The lead is now lost.
            console.error('CRITICAL: EMAIL SENDING FAILED for /contact after retries:', { 
                error: emailError.message,
                code: emailError.code 
            });
            // We still send a generic server error to the user, as the DB may have failed anyway.
            return res.status(500).json({ status: 'Error', description: 'A server error occurred while processing your request.' });
        }

        // --- 3. Send final response to the form submitter ---
        if (dbSuccess) {
            res.status(200).json({ status: 'Success', description: 'Form submitted successfully.' });
        } else {
            // As agreed, if the DB failed, the customer gets an error, even though the internal email was sent.
            res.status(500).json({ status: 'Error', description: 'Your request could not be saved at this time. Please try again later.' });
        }
    }
);

// 3. Route for the Demo Request Form
router.post(
    '/demo',
    demoLimiter,
    validateOrigin,
    validateCSRF,
    validateRequestDemoInput,
    [
        body('firstName', 'First name is required').notEmpty().trim().escape(),
        body('lastName', 'Last name is required').notEmpty().trim().escape(),
        body('jobTitle', 'Job title is required').notEmpty().trim().escape(),
        body('companyName', 'Company name is required').notEmpty().trim().escape(),
        body('workEmail', 'Please include a valid work email').isEmail().normalizeEmail(),
        body('phone', 'Please include a valid phone number').matches(/^[\d\s-()+.]{10,20}$/).withMessage('Invalid phone number format').trim().escape(),
        body('screeningsPerYear', 'Screenings per year is required').notEmpty().trim().escape(),
        body('servicesOfInterest', 'Services of interest is required').notEmpty().trim().escape(),
        body('message').optional({ checkFalsy: true }).trim().escape(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { firstName, lastName, jobTitle, companyName, workEmail, phone, screeningsPerYear, servicesOfInterest, message } = req.body;
        
        let dbSuccess = false;
        let dbErrorMessage = '';

        // --- 1. Attempt to save to the database ---
        try {
            const dbQuery = 'INSERT INTO demo_requests (first_name, last_name, job_title, company_name, work_email, phone, screenings_per_year, services_of_interest, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
            await pool.query(dbQuery, [firstName, lastName, jobTitle, companyName, workEmail, phone, screeningsPerYear, servicesOfInterest, message]);
            dbSuccess = true;
        } catch (dbError) {
            console.error('DATABASE INSERT FAILED for /demo:', { 
                error: dbError.message,
                code: dbError.code,
                errno: dbError.errno 
            });
            dbErrorMessage = dbError.message;
            dbSuccess = false;
        }

        // --- 2. Construct email with DB status and send it ---
        const dbStatusLine = dbSuccess
            ? '<p><strong>Database Status:</strong> <span style="color:green;">Successfully saved.</span></p>'
            : `<p><strong>Database Status:</strong> <span style="color:red;">FAILED.</span><br><strong>Error:</strong> ${process.env.NODE_ENV === 'production' ? 'A database error occurred.' : escapeHTML(dbErrorMessage)}</p>`;
        
        const recipientEmail = await getEmailRecipient('demo');
        const mailOptions = {
            from: `"ChexPro Website" <${escapeHTML(process.env.SMTP_USER)}>`,
            to: escapeHTML(recipientEmail),
            subject: dbSuccess ? 'New Demo Request' : '⚠️ ACTION REQUIRED: Demo Request DB Save Failed',
            html: `
                <h3>New Demo Request</h3>
                <p><strong>Name:</strong> ${escapeHTML(firstName)} ${escapeHTML(lastName)}</p>
                <p><strong>Job Title:</strong> ${escapeHTML(jobTitle)}</p>
                <p><strong>Company:</strong> ${escapeHTML(companyName)}</p>
                <p><strong>Work Email:</strong> ${escapeHTML(workEmail)}</p>
                <p><strong>Phone:</strong> ${escapeHTML(phone)}</p>
                <p><strong>Screenings Per Year:</strong> ${escapeHTML(screeningsPerYear)}</p>
                <p><strong>Services of Interest:</strong> ${escapeHTML(servicesOfInterest)}</p>
                <p><strong>Message:</strong></p>
                <p>${escapeHTML(message || 'N/A')}</p>
                <hr>
                ${dbStatusLine}
            `,
        };

        try {
            await sendEmailWithRetry(transporter, mailOptions, 3);
        } catch (emailError) {
            console.error('CRITICAL: EMAIL SENDING FAILED for /demo after retries:', { 
                error: emailError.message,
                code: emailError.code 
            });
            return res.status(500).json({ status: 'Error', description: 'A server error occurred while processing your request.' });
        }

        // --- 3. Send final response to the form submitter ---
        if (dbSuccess) {
            res.status(200).json({ status: 'Success', description: 'Demo request submitted successfully.' });
        } else {
            res.status(500).json({ status: 'Error', description: 'Your request could not be saved at this time. Please try again later.' });
        }
    }
);

export default router;
