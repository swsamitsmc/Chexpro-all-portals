import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { parsePagination } from '../utils/helpers';
import { uploadSingle, uploadMultiple } from '../middleware/upload';
import { encryptField, decryptField } from '../utils/encryption';
import { AuthenticatedRequest } from '../types';
import fs from 'fs';
import path from 'path';

const router = Router();
router.use(authenticate as any);

// ============================================================
// ZOD SCHEMAS
// ============================================================

const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1).default('Canada'),
  residenceType: z.string().optional(),
  yearsAtAddress: z.number().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const employmentHistorySchema = z.object({
  employer: z.string().min(1),
  jobTitle: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().optional(),
  supervisorName: z.string().optional(),
  supervisorContact: z.string().optional(),
  reasonForLeaving: z.string().optional(),
  canContact: z.boolean().optional(),
});

const educationHistorySchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  fieldOfStudy: z.string().optional(),
  graduationDate: z.string().optional(),
  studentId: z.string().optional(),
});

const createApplicantSchema = z.object({
  orderId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  middleName: z.string().optional(),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().optional(),
  sin: z.string().optional(), // Will be encrypted
  email: z.string().email().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  currentAddress: addressSchema.optional(),
  addressHistory: z.array(addressSchema).optional(),
  employmentHistory: z.array(employmentHistorySchema).optional(),
  educationHistory: z.array(educationHistorySchema).optional(),
  additionalInfo: z.record(z.unknown()).optional(),
  otherNames: z.array(z.string()).optional(),
});

const updateApplicantSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  middleName: z.string().optional(),
  lastName: z.string().min(1).max(100).optional(),
  dateOfBirth: z.string().optional(),
  sin: z.string().optional(), // Will be encrypted
  email: z.string().email().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  currentAddress: addressSchema.optional(),
  addressHistory: z.array(addressSchema).optional(),
  employmentHistory: z.array(employmentHistorySchema).optional(),
  educationHistory: z.array(educationHistorySchema).optional(),
  additionalInfo: z.record(z.unknown()).optional(),
  otherNames: z.array(z.string()).optional(),
  portalStep: z.number().int().min(0).max(7).optional(),
});

const consentSchema = z.object({
  consentGiven: z.boolean(),
  signature: z.string(), // Base64 encoded signature image
});

// ============================================================
// APPLICANT ROUTES
// ============================================================

// GET /api/v1/applicants - List applicants (filtered by client)
router.get('/', requirePermission('applicants:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const { search, status } = req.query as Record<string, string>;

    // Get orders for this client
    const orderIds = await prisma.order.findMany({
      where: { clientId: user.clientId },
      select: { id: true },
    });
    const clientOrderIds = orderIds.map(o => o.id);

    const where: any = {
      orders: { some: { id: { in: clientOrderIds } } },
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Note: Filtering by portal_completed/status requires additional logic
    // For now, we'll return all applicants and let frontend filter

    const [applicants, total] = await Promise.all([
      prisma.applicant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          orders: {
            where: { clientId: user.clientId },
            select: { id: true, orderNumber: true, positionTitle: true, status: true },
            take: 1,
          },
        },
      }),
      prisma.applicant.count({ where }),
    ]);

    // Decrypt SIN for display (only last 4 digits shown for security)
    const maskedApplicants = applicants.map(app => ({
      ...app,
      sin: app.sinEncrypted ? `****-${decryptField(app.sinEncrypted).slice(-4)}` : null,
    }));

    return sendPaginated(res, maskedApplicants, total, page, limit);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applicants - Create applicant record (linked to order)
router.post('/', requirePermission('applicants:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = createApplicantSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const { orderId, sin, ...applicantData } = parsed.data;

    // Verify order exists and belongs to client's client
    const order = await prisma.order.findFirst({
      where: { id: orderId, clientId: user.clientId },
    });

    if (!order) {
      return sendError(res, 404, 'NOT_FOUND', 'Order not found');
    }

    // Check if applicant already exists for this order
    if (order.applicantId) {
      return sendError(res, 400, 'APPLICANT_EXISTS', 'Applicant already exists for this order');
    }

    // Encrypt SIN if provided
    const sinEncrypted = sin ? encryptField(sin) : null;

    // Create applicant
    const applicant = await prisma.applicant.create({
      data: {
        ...applicantData,
        sinEncrypted,
        currentAddress: applicantData.currentAddress as any,
        addressHistory: applicantData.addressHistory as any,
        employmentHistory: applicantData.employmentHistory as any,
        educationHistory: applicantData.educationHistory as any,
        additionalInfo: applicantData.additionalInfo as any,
        otherNames: applicantData.otherNames as any,
        portalStep: 1, // Step 1: Personal Information
      },
    });

    // Link applicant to order
    await prisma.order.update({
      where: { id: orderId },
      data: { applicantId: applicant.id },
    });

    // Create timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId,
        status: 'applicant_created',
        description: 'Applicant information submitted',
        createdBy: user.email,
      },
    });

    // Return without exposing full SIN
    return sendSuccess(res, {
      ...applicant,
      sin: sin ? '****-****' : null,
    }, 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/applicants/:id - Get applicant data
router.get('/:id', requirePermission('applicants:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Find applicant through orders belonging to client
    const applicant = await prisma.applicant.findFirst({
      where: {
        id,
        orders: { some: { clientId: user.clientId } },
      },
      include: {
        orders: {
          where: { clientId: user.clientId },
          select: { id: true, orderNumber: true, positionTitle: true, status: true, packageId: true },
        },
        documents: true,
      },
    });

    if (!applicant) {
      return sendError(res, 404, 'NOT_FOUND', 'Applicant not found');
    }

    // Decrypt SIN for authorized users
    const sin = applicant.sinEncrypted ? decryptField(applicant.sinEncrypted) : null;

    return sendSuccess(res, {
      ...applicant,
      sin,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/applicants/:id - Update applicant data (any step)
router.put('/:id', requirePermission('applicants:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = updateApplicantSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    // Verify applicant belongs to client's order
    const existing = await prisma.applicant.findFirst({
      where: {
        id,
        orders: { some: { clientId: user.clientId } },
      },
      include: { orders: { where: { clientId: user.clientId }, select: { id: true } } },
    });

    if (!existing) {
      return sendError(res, 404, 'NOT_FOUND', 'Applicant not found');
    }

    const { sin, ...updateData } = parsed.data;

    // Encrypt SIN if provided
    const dataToUpdate: any = { ...updateData };
    if (sin) {
      dataToUpdate.sinEncrypted = encryptField(sin);
    }
    if (updateData.currentAddress) {
      dataToUpdate.currentAddress = updateData.currentAddress as any;
    }
    if (updateData.addressHistory) {
      dataToUpdate.addressHistory = updateData.addressHistory as any;
    }
    if (updateData.employmentHistory) {
      dataToUpdate.employmentHistory = updateData.employmentHistory as any;
    }
    if (updateData.educationHistory) {
      dataToUpdate.educationHistory = updateData.educationHistory as any;
    }
    if (updateData.additionalInfo) {
      dataToUpdate.additionalInfo = updateData.additionalInfo as any;
    }
    if (updateData.otherNames) {
      dataToUpdate.otherNames = updateData.otherNames as any;
    }

    const applicant = await prisma.applicant.update({
      where: { id },
      data: dataToUpdate,
    });

    // Check if portal is complete (all 7 steps done + consent + docs)
    const hasPersonalInfo = !!applicant.firstName && !!applicant.lastName;
    const hasAddress = !!applicant.currentAddress;
    const hasConsent = applicant.consentGiven;
    const docCount = await prisma.document.count({ where: { applicantId: id } });
    const hasDocs = docCount > 0;

    // Portal steps: 1=Personal, 2=Address, 3=Employment, 4=Education, 5=Review, 6=Consent, 7=Documents
    if (hasPersonalInfo && hasAddress && hasConsent && hasDocs && (applicant.portalStep || 0) >= 7) {
      await prisma.applicant.update({
        where: { id },
        data: { portalCompleted: true },
      });

      // Update order status to data_verification
      if (existing.orders[0]) {
        await prisma.order.update({
          where: { id: existing.orders[0].id },
          data: { status: 'data_verification' },
        });

        await prisma.orderTimeline.create({
          data: {
            orderId: existing.orders[0].id,
            status: 'data_verification',
            description: 'Applicant portal completed - data verification started',
            createdBy: user.email,
          },
        });
      }
    }

    // Return without exposing full SIN
    return sendSuccess(res, {
      ...applicant,
      sin: sin ? '****-****' : (applicant.sinEncrypted ? '****-****' : null),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applicants/:id/documents - Upload document
router.post('/:id/documents', requirePermission('applicants:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Verify applicant belongs to client's order
    const applicant = await prisma.applicant.findFirst({
      where: {
        id,
        orders: { some: { clientId: user.clientId } },
      },
      include: { orders: { where: { clientId: user.clientId }, select: { id: true } } },
    });

    if (!applicant) {
      return sendError(res, 404, 'NOT_FOUND', 'Applicant not found');
    }

    // Multer middleware handles file upload
    uploadSingle(req, res, async (err: any) => {
      if (err) {
        return sendError(res, 400, 'UPLOAD_ERROR', err.message || 'File upload failed');
      }

      const file = req.file;
      if (!file) {
        return sendError(res, 400, 'NO_FILE', 'No file uploaded');
      }

      const { documentType } = req.body;
      if (!documentType) {
        // Delete uploaded file
        fs.unlinkSync(file.path);
        return sendError(res, 400, 'VALIDATION_ERROR', 'documentType is required');
      }

      const document = await prisma.document.create({
        data: {
          applicantId: id,
          orderId: applicant.orders[0]?.id,
          documentType,
          fileName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedBy: user.email,
        },
      });

      // Update portal step to 7 (Documents)
      await prisma.applicant.update({
        where: { id },
        data: { portalStep: 7 },
      });

      return sendSuccess(res, document, 201);
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/applicants/:id/documents - List uploaded documents
router.get('/:id/documents', requirePermission('applicants:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Verify applicant belongs to client's order
    const applicant = await prisma.applicant.findFirst({
      where: {
        id,
        orders: { some: { clientId: user.clientId } },
      },
    });

    if (!applicant) {
      return sendError(res, 404, 'NOT_FOUND', 'Applicant not found');
    }

    const documents = await prisma.document.findMany({
      where: { applicantId: id },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, documents);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/applicants/:id/documents/:docId - Delete document
router.delete('/:id/documents/:docId', requirePermission('applicants:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id, docId } = req.params;

    // Verify applicant belongs to client's order
    const applicant = await prisma.applicant.findFirst({
      where: {
        id,
        orders: { some: { clientId: user.clientId } },
      },
    });

    if (!applicant) {
      return sendError(res, 404, 'NOT_FOUND', 'Applicant not found');
    }

    // Find and verify document
    const document = await prisma.document.findFirst({
      where: { id: docId, applicantId: id },
    });

    if (!document) {
      return sendError(res, 404, 'NOT_FOUND', 'Document not found');
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete from database
    await prisma.document.delete({ where: { id: docId } });

    return sendSuccess(res, { message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applicants/:id/consent - Record consent with timestamp
router.post('/:id/consent', requirePermission('applicants:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = consentSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const { consentGiven, signature } = parsed.data;

    // Verify applicant belongs to client's order
    const applicant = await prisma.applicant.findFirst({
      where: {
        id,
        orders: { some: { clientId: user.clientId } },
      },
      include: { orders: { where: { clientId: user.clientId }, select: { id: true } } },
    });

    if (!applicant) {
      return sendError(res, 404, 'NOT_FOUND', 'Applicant not found');
    }

    if (!consentGiven) {
      return sendError(res, 400, 'CONSENT_REQUIRED', 'Consent must be given to proceed');
    }

    // Update applicant with consent
    const updated = await prisma.applicant.update({
      where: { id },
      data: {
        consentGiven: true,
        consentSignature: signature, // Store base64 signature
        consentDate: new Date(),
        portalStep: 6, // Step 6: Consent
      },
    });

    // Create timeline entry
    if (applicant.orders[0]) {
      await prisma.orderTimeline.create({
        data: {
          orderId: applicant.orders[0].id,
          status: 'consent_recorded',
          description: 'Applicant consent recorded',
          createdBy: user.email,
        },
      });
    }

    return sendSuccess(res, { message: 'Consent recorded successfully', consentDate: updated.consentDate });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applicants/:id/e-signature - Store base64 e-signature image
router.post('/:id/e-signature', requirePermission('applicants:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { signature } = req.body;

    if (!signature) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Signature is required');
    }

    // Verify it's a valid base64 image
    if (!signature.startsWith('data:image/')) {
      return sendError(res, 400, 'INVALID_SIGNATURE', 'Signature must be a base64 image');
    }

    // Verify applicant belongs to client's order
    const applicant = await prisma.applicant.findFirst({
      where: {
        id,
        orders: { some: { clientId: user.clientId } },
      },
    });

    if (!applicant) {
      return sendError(res, 404, 'NOT_FOUND', 'Applicant not found');
    }

    // Store signature (could also save to file and store path)
    await prisma.applicant.update({
      where: { id },
      data: { consentSignature: signature },
    });

    return sendSuccess(res, { message: 'E-signature stored successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/applicants/auto-populate/:id - Return previous applicant address history for pre-fill
router.get('/auto-populate/:id', requirePermission('applicants:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Get the current applicant's email to find previous applications
    const currentApplicant = await prisma.applicant.findFirst({
      where: {
        id,
        orders: { some: { clientId: user.clientId } },
      },
    });

    if (!currentApplicant || !currentApplicant.email) {
      return sendError(res, 404, 'NOT_FOUND', 'Applicant not found or no email on file');
    }

    // Find other applicants with the same email (previous applications)
    const previousApplicants = await prisma.applicant.findMany({
      where: {
        email: currentApplicant.email,
        id: { not: id }, // Exclude current
      },
      select: {
        id: true,
        addressHistory: true,
        employmentHistory: true,
        educationHistory: true,
      },
    });

    // Aggregate unique addresses
    const addressHistory: any[] = [];
    const seenAddresses = new Set<string>();

    for (const prev of previousApplicants) {
      const history = prev.addressHistory as any[] || [];
      for (const addr of history) {
        const key = `${addr.street}-${addr.city}-${addr.province}`;
        if (!seenAddresses.has(key)) {
          seenAddresses.add(key);
          addressHistory.push({ ...addr, fromPreviousApplication: true });
        }
      }
    }

    return sendSuccess(res, {
      addressHistory,
      previousApplicationCount: previousApplicants.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applicants/:id/submit - Submit applicant for processing
router.post('/:id/submit', requirePermission('applicants:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Verify applicant belongs to client's order
    const applicant = await prisma.applicant.findFirst({
      where: {
        id,
        orders: { some: { clientId: user.clientId } },
      },
      include: { orders: { where: { clientId: user.clientId }, select: { id: true, status: true } } },
    });

    if (!applicant) {
      return sendError(res, 404, 'NOT_FOUND', 'Applicant not found');
    }

    // Check required fields for submission
    if (!applicant.firstName || !applicant.lastName) {
      return sendError(res, 400, 'INCOMPLETE_DATA', 'Personal information is required');
    }

    if (!applicant.currentAddress) {
      return sendError(res, 400, 'INCOMPLETE_DATA', 'Current address is required');
    }

    if (!applicant.consentGiven) {
      return sendError(res, 400, 'CONSENT_REQUIRED', 'Consent is required before submission');
    }

    // Check for documents
    const docCount = await prisma.document.count({ where: { applicantId: id } });
    if (docCount === 0) {
      return sendError(res, 400, 'NO_DOCUMENTS', 'At least one document is required');
    }

    // Update order status to data_verification
    if (applicant.orders[0]) {
      await prisma.order.update({
        where: { id: applicant.orders[0].id },
        data: { status: 'data_verification' },
      });

      // Create timeline entry
      await prisma.orderTimeline.create({
        data: {
          orderId: applicant.orders[0].id,
          status: 'data_verification',
          description: 'Applicant data submitted for verification',
          createdBy: user.email,
        },
      });
    }

    // Mark portal as complete
    await prisma.applicant.update({
      where: { id },
      data: { portalCompleted: true, portalStep: 7 },
    });

    return sendSuccess(res, { message: 'Applicant submitted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
