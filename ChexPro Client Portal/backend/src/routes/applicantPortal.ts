import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { sendEmail } from '../utils/email';
import { encryptField, decryptField } from '../utils/encryption';

const router = Router();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Validate invitation token and return applicant if valid
 */
async function validateToken(token: string) {
  if (!token) return null;
  
  const applicant = await prisma.applicant.findFirst({
    where: {
      invitationToken: token,
      OR: [
        { tokenExpiresAt: null },
        { tokenExpiresAt: { gt: new Date() } },
      ],
    },
  });
  
  return applicant;
}

// ============================================================
// ZOD SCHEMAS
// ============================================================

const inviteSchema = z.object({
  orderId: z.string().uuid(),
  applicantEmail: z.string().email(),
  applicantPhone: z.string().optional(),
});

const applicantDataSchema = z.object({
  // Step 1: Personal Info
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  sin: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  // Step 2: Current Address
  currentAddress: z.object({
    street: z.string(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string(),
    country: z.string(),
    residenceType: z.string().optional(),
    yearsAtAddress: z.number().optional(),
  }).optional(),
  // Step 3: Address History
  addressHistory: z.array(z.object({
    street: z.string(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string(),
    country: z.string(),
    from: z.string().optional(),
    to: z.string().optional(),
  })).optional(),
  // Step 4: Employment
  employmentHistory: z.array(z.object({
    employer: z.string(),
    jobTitle: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    supervisorName: z.string().optional(),
    supervisorContact: z.string().optional(),
    reasonForLeaving: z.string().optional(),
    canContact: z.boolean().optional(),
  })).optional(),
  // Step 5: Education
  educationHistory: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    fieldOfStudy: z.string().optional(),
    graduationDate: z.string().optional(),
    studentId: z.string().optional(),
  })).optional(),
  // Step 6: Additional Info
  additionalInfo: z.record(z.unknown()).optional(),
});

// ============================================================
// ROUTES
// ============================================================

// POST /api/v1/applicant-portal/invite
// Requires JWT authentication (client user sending invite)
router.post('/invite', authenticate as any, async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const parsed = inviteSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const { orderId, applicantEmail, applicantPhone } = parsed.data;

    // Verify order exists and belongs to client
    const order = await prisma.order.findFirst({
      where: { id: orderId, clientId: user.clientId },
      include: { applicant: true, package: true },
    });

    if (!order) {
      return sendError(res, 404, 'NOT_FOUND', 'Order not found');
    }

    // Check if applicant already exists
    let applicant = order.applicant;

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    if (!applicant) {
      // Create new applicant record
      applicant = await prisma.applicant.create({
        data: {
          firstName: '', // Will be filled by applicant
          lastName: '',
          email: applicantEmail,
          phone: applicantPhone || null,
          invitationToken,
          tokenExpiresAt,
          portalStep: 0,
        },
      });

      // Link to order
      await prisma.order.update({
        where: { id: orderId },
        data: { applicantId: applicant.id },
      });
    } else {
      // Update existing applicant with new token
      applicant = await prisma.applicant.update({
        where: { id: applicant.id },
        data: { invitationToken, tokenExpiresAt },
      });
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'awaiting_applicant' },
    });

    // Add timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId,
        status: 'awaiting_applicant',
        description: 'Invitation sent to applicant',
        createdBy: 'System',
      },
    });

    // Get client info for email
    const client = await prisma.client.findUnique({
      where: { id: user.clientId },
      select: { companyName: true },
    });

    // Send invitation email - point to Candidate Portal register page
    const portalLink = `${env.candidatePortalUrl}/register?token=${invitationToken}`;
    await sendEmail({
      to: applicantEmail,
      subject: `Complete Your Background Check for ${client?.companyName ?? 'ChexPro'}`,
      html: `
        <h2>Background Check Invitation</h2>
        <p>You have been invited to complete a background check for ${client?.companyName ?? 'ChexPro'}.</p>
        <p>Please click the link below to begin:</p>
        <p><a href="${portalLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Complete Your Information</a></p>
        <p>This link will expire in 14 days.</p>
      `,
      text: `You have been invited to complete a background check. Visit ${portalLink} to begin. This link will expire in 14 days.`,
    });

    return sendSuccess(res, {
      token: invitationToken,
      expiresAt: tokenExpiresAt,
    }, 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/applicant-portal/:token
// Public route - validate token and return applicant data
router.get('/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const applicant = await validateToken(token);

    if (!applicant) {
      return sendError(res, 404, 'INVALID_TOKEN', 'Invalid or expired invitation token');
    }

    if (applicant.tokenExpiresAt && new Date(applicant.tokenExpiresAt) < new Date()) {
      return sendError(res, 410, 'TOKEN_EXPIRED', 'Invitation token has expired');
    }

    // Get linked order with client info
    const order = await prisma.order.findFirst({
      where: { applicantId: applicant.id },
      include: {
        client: { select: { companyName: true } },
        package: { select: { name: true } },
      },
    });

    // Return applicant data (exclude sensitive fields)
    return sendSuccess(res, {
      applicantId: applicant.id,
      firstName: applicant.firstName,
      lastName: applicant.lastName,
      email: applicant.email,
      portalStep: applicant.portalStep,
      portalCompleted: applicant.portalCompleted,
      order: order ? {
        orderId: order.id,
        orderNumber: order.orderNumber,
        positionTitle: order.positionTitle,
        clientName: order.client.companyName,
        packageName: order.package?.name,
      } : null,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/applicant-portal/:token/data
// Public route - update applicant data for any wizard step
router.put('/:token/data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const parsed = applicantDataSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const applicant = await validateToken(token);

    if (!applicant) {
      return sendError(res, 404, 'INVALID_TOKEN', 'Invalid or expired invitation token');
    }

    if (applicant.tokenExpiresAt && new Date(applicant.tokenExpiresAt) < new Date()) {
      return sendError(res, 410, 'TOKEN_EXPIRED', 'Invitation token has expired');
    }

    const data = parsed.data;
    const updateData: any = {};

    // Step 1: Personal Info
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.middleName !== undefined) updateData.middleName = data.middleName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.sin !== undefined) updateData.sinEncrypted = data.sin ? encryptField(data.sin) : null;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.gender !== undefined) updateData.gender = data.gender;

    // Step 2: Current Address
    if (data.currentAddress !== undefined) updateData.currentAddress = data.currentAddress as any;

    // Step 3: Address History
    if (data.addressHistory !== undefined) updateData.addressHistory = data.addressHistory as any;

    // Step 4: Employment History
    if (data.employmentHistory !== undefined) updateData.employmentHistory = data.employmentHistory as any;

    // Step 5: Education History
    if (data.educationHistory !== undefined) updateData.educationHistory = data.educationHistory as any;

    // Step 6: Additional Info
    if (data.additionalInfo !== undefined) updateData.additionalInfo = data.additionalInfo as any;

    // Determine portal step based on what data was provided
    let newStep = applicant.portalStep || 0;
    if (data.firstName && data.lastName) newStep = Math.max(newStep, 1);
    if (data.currentAddress) newStep = Math.max(newStep, 2);
    if (data.addressHistory) newStep = Math.max(newStep, 3);
    if (data.employmentHistory) newStep = Math.max(newStep, 4);
    if (data.educationHistory) newStep = Math.max(newStep, 5);
    if (data.additionalInfo) newStep = Math.max(newStep, 6);
    
    updateData.portalStep = newStep;

    // Auto-calculate portal_completed
    const hasPersonalInfo = !!(updateData.firstName && updateData.lastName);
    const hasAddress = !!updateData.currentAddress;
    const hasConsent = applicant.consentGiven;
    const completedSteps = [];
    if (hasPersonalInfo) completedSteps.push(1);
    if (hasAddress) completedSteps.push(2);
    if (data.addressHistory) completedSteps.push(3);
    if (data.employmentHistory) completedSteps.push(4);
    if (data.educationHistory) completedSteps.push(5);
    if (data.additionalInfo) completedSteps.push(6);

    const portalCompleted = hasPersonalInfo && hasAddress && hasConsent && completedSteps.length >= 6;
    if (portalCompleted) {
      updateData.portalCompleted = true;
    }

    const updated = await prisma.applicant.update({
      where: { id: applicant.id },
      data: updateData,
    });

    return sendSuccess(res, {
      applicantId: updated.id,
      completedSteps,
      portalCompleted: updated.portalCompleted,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applicant-portal/:token/submit
// Public route - submit completed application
router.post('/:token/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const applicant = await validateToken(token);

    if (!applicant) {
      return sendError(res, 404, 'INVALID_TOKEN', 'Invalid or expired invitation token');
    }

    if (applicant.tokenExpiresAt && new Date(applicant.tokenExpiresAt) < new Date()) {
      return sendError(res, 410, 'TOKEN_EXPIRED', 'Invitation token has expired');
    }

    // Check required fields
    const missingSteps: number[] = [];
    if (!applicant.firstName || !applicant.lastName) missingSteps.push(1);
    if (!applicant.currentAddress) missingSteps.push(2);
    if (!applicant.consentGiven) missingSteps.push(6); // Consent is step 6

    if (missingSteps.length > 0) {
      return sendError(res, 400, 'INCOMPLETE_DATA', 'Please complete all required steps', [
        { field: 'missingSteps', message: `Missing steps: ${missingSteps.join(', ')}` },
      ]);
    }

    // Get linked order
    const order = await prisma.order.findFirst({
      where: { applicantId: applicant.id },
      include: { client: true },
    });

    if (!order) {
      return sendError(res, 404, 'NOT_FOUND', 'Order not found');
    }

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'data_verification' },
    });

    // Mark portal as completed
    await prisma.applicant.update({
      where: { id: applicant.id },
      data: { portalCompleted: true, portalStep: 7 },
    });

    // Add timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        status: 'data_verification',
        description: 'Applicant submitted information',
        createdBy: 'Applicant Portal',
      },
    });

    // Send confirmation email to applicant
    if (applicant.email) {
      await sendEmail({
        to: applicant.email,
        subject: 'Background Check Information Submitted',
        html: `
          <h2>Information Submitted Successfully</h2>
          <p>Thank you for completing your background check information.</p>
          <p>Your application is now being processed. You will receive updates via email.</p>
          <p>Order Reference: ${order.orderNumber}</p>
        `,
        text: `Your background check information has been submitted. Order Reference: ${order.orderNumber}`,
      });
    }

    // Send notification to client
    const clientUsers = await prisma.user.findMany({
      where: { clientId: order.clientId, status: 'active' },
      select: { email: true },
    });

    for (const user of clientUsers) {
      await sendEmail({
        to: user.email,
        subject: `Applicant Submitted Information - ${order.orderNumber}`,
        html: `
          <h2>Applicant Submitted Information</h2>
          <p>An applicant has submitted their background check information.</p>
          <p>Order: ${order.orderNumber}</p>
          <p>Applicant: ${applicant.firstName} ${applicant.lastName}</p>
          <p>Position: ${order.positionTitle}</p>
        `,
        text: `Applicant submitted information for order ${order.orderNumber}`,
      });
    }

    return sendSuccess(res, {
      message: 'Submission received',
      orderId: order.id,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/applicant-portal/:token/status
// Public route - check order status (no personal data)
router.get('/:token/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const applicant = await validateToken(token);

    if (!applicant) {
      return sendError(res, 404, 'INVALID_TOKEN', 'Invalid or expired invitation token');
    }

    if (applicant.tokenExpiresAt && new Date(applicant.tokenExpiresAt) < new Date()) {
      return sendError(res, 410, 'TOKEN_EXPIRED', 'Invitation token has expired');
    }

    // Get order status only
    const order = await prisma.order.findFirst({
      where: { applicantId: applicant.id },
      select: {
        id: true,
        orderNumber: true,
        positionTitle: true,
        status: true,
        submittedAt: true,
        completedAt: true,
      },
    });

    if (!order) {
      return sendError(res, 404, 'NOT_FOUND', 'Order not found');
    }

    // Calculate estimated completion (rough estimate based on package turnaround)
    const estimatedCompletionDate = order.completedAt 
      ? null 
      : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // Default 5 days

    return sendSuccess(res, {
      orderStatus: order.status,
      orderNumber: order.orderNumber,
      positionTitle: order.positionTitle,
      submittedAt: order.submittedAt,
      estimatedCompletionDate,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applicant-portal/:token/consent
// Public route - record consent
router.post('/:token/consent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const { consentGiven, signature } = req.body;

    if (consentGiven !== true) {
      return sendError(res, 400, 'CONSENT_REQUIRED', 'Consent must be given to proceed');
    }

    const applicant = await validateToken(token);

    if (!applicant) {
      return sendError(res, 404, 'INVALID_TOKEN', 'Invalid or expired invitation token');
    }

    if (applicant.tokenExpiresAt && new Date(applicant.tokenExpiresAt) < new Date()) {
      return sendError(res, 410, 'TOKEN_EXPIRED', 'Invitation token has expired');
    }

    // Update consent
    const updated = await prisma.applicant.update({
      where: { id: applicant.id },
      data: {
        consentGiven: true,
        consentSignature: signature || null,
        consentDate: new Date(),
        portalStep: Math.max(applicant.portalStep || 0, 6),
      },
    });

    return sendSuccess(res, { consentDate: updated.consentDate });
  } catch (error) {
    next(error);
  }
});

export default router;
