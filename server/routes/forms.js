const express = require('express');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const pool = require('../config/db'); // --- DB CHANGE --- Import the connection pool

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply the rate limiting middleware to all routes in this file
router.use(limiter);

// 1. Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Function to escape HTML
const escapeHTML = (str) => {
    if (!str) return str;
    return str.replace(/[&<>'"/]/g, function (tag) {
        const chars = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;',
            '/': '&#x2F;'
        };
        return chars[tag] || tag;
    });
};

// 2. Route for the Contact Form
router.post(
    '/contact',
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
            console.error('DATABASE INSERT FAILED for /contact:', dbError);
            dbErrorMessage = dbError.message;
            dbSuccess = false;
        }

        // --- 2. Construct email with DB status and send it ---
        const dbStatusLine = dbSuccess
            ? '<p><strong>Database Status:</strong> <span style="color:green;">Successfully saved.</span></p>'
            : `<p><strong>Database Status:</strong> <span style="color:red;">FAILED.</span><br><strong>Error:</strong> ${escapeHTML(dbErrorMessage)}</p>`;

        const mailOptions = {
            from: `"ChexPro Website" <${process.env.SMTP_USER}>`,
            to: process.env.CONTACT_RECIPIENT,
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
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            // This is the worst case: DB may have failed AND email failed. The lead is now lost.
            console.error('CRITICAL: EMAIL SENDING FAILED for /contact:', emailError);
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
            console.error('DATABASE INSERT FAILED for /demo:', dbError);
            dbErrorMessage = dbError.message;
            dbSuccess = false;
        }

        // --- 2. Construct email with DB status and send it ---
        const dbStatusLine = dbSuccess
            ? '<p><strong>Database Status:</strong> <span style="color:green;">Successfully saved.</span></p>'
            : `<p><strong>Database Status:</strong> <span style="color:red;">FAILED.</span><br><strong>Error:</strong> ${escapeHTML(dbErrorMessage)}</p>`;
        
        const mailOptions = {
            from: `"ChexPro Website" <${process.env.SMTP_USER}>`,
            to: process.env.DEMO_RECIPIENT,
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
                <p>${escapeHTML(message) || 'N/A'}</p>
                <hr>
                ${dbStatusLine}
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('CRITICAL: EMAIL SENDING FAILED for /demo:', emailError);
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

module.exports = router;