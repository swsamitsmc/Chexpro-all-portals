import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Apply authentication to all routes
router.use(authenticate as any);

// Zod schemas
const initiateSchema = z.object({
  orderId: z.string().uuid(),
  preNoticeMethod: z.enum(['email', 'mail', 'fax']).optional().default('email'),
});

const sendPreNoticeSchema = z.object({
  preNoticeMethod: z.enum(['email', 'mail', 'fax']).optional(),
});

const candidateResponseSchema = z.object({
  response: z.enum(['dispute', 'accept', 'request_more_info']),
  disputeDetails: z.string().optional(),
  notes: z.string().optional(),
});

const finalDecisionSchema = z.object({
  decision: z.enum(['proceed', 'withdraw', 'revise_offer']),
  notes: z.string().optional(),
});

const uploadDocumentSchema = z.object({
  documentType: z.enum(['pre_notice', 'final_notice', 'supporting_doc']),
});

// GET /api/v1/adverse-actions - List all adverse actions for client's orders
router.get('/', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { status, page = '1', limit = '20' } = req.query;
    
    const where: any = {
      order: { clientId: user.clientId },
    };
    if (status) where.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const [items, total] = await Promise.all([
      prisma.adverseAction.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              positionTitle: true,
              applicant: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          documents: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.adverseAction.count({ where }),
    ]);

    return sendSuccess(res, {
      items,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/adverse-actions/:id - Get single adverse action
router.get('/:id', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const adverseAction = await prisma.adverseAction.findFirst({
      where: { id, order: { clientId: user.clientId } },
      include: {
        order: {
          include: {
            applicant: true,
            package: { select: { name: true } },
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!adverseAction) {
      return sendError(res, 404, 'NOT_FOUND', 'Adverse action not found');
    }

    return sendSuccess(res, adverseAction);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/adverse-actions/order/:orderId - Get adverse action by order
router.get('/order/:orderId', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { orderId } = req.params;

    const adverseAction = await prisma.adverseAction.findFirst({
      where: { orderId, order: { clientId: user.clientId } },
      include: {
        documents: true,
      },
    });

    if (!adverseAction) {
      return sendError(res, 404, 'NOT_FOUND', 'No adverse action found for this order');
    }

    return sendSuccess(res, adverseAction);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/adverse-actions - Initiate adverse action for an order
router.post('/', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = initiateSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input', 
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const { orderId, preNoticeMethod } = parsed.data;

    // Verify order exists and belongs to client
    const order = await prisma.order.findFirst({
      where: { id: orderId, clientId: user.clientId },
      include: { applicant: true },
    });

    if (!order) {
      return sendError(res, 404, 'NOT_FOUND', 'Order not found');
    }

    if (!order.applicantId || !order.applicant?.email) {
      return sendError(res, 400, 'MISSING_APPLICANT', 'Order must have an applicant with email for adverse action');
    }

    // Check if adverse action already exists
    const existing = await prisma.adverseAction.findFirst({
      where: { orderId, status: { notIn: ['cancelled', 'completed'] } },
    });

    if (existing) {
      return sendError(res, 400, 'ALREADY_EXISTS', 'An active adverse action already exists for this order');
    }

    // Create adverse action
    const adverseAction = await prisma.adverseAction.create({
      data: {
        orderId,
        preNoticeMethod,
        status: 'initiated',
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'requires_action' },
    });

    // Create timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId,
        status: 'adverse_action_initiated',
        description: 'Adverse action process initiated',
        createdBy: user.email,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'adverse_action_initiated',
        resourceType: 'adverse_action',
        resourceId: adverseAction.id,
        requestDetails: { orderId, preNoticeMethod },
      },
    });

    return sendSuccess(res, adverseAction, 201);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/adverse-actions/:id/send-pre-notice - Send pre-adverse action notice
router.post('/:id/send-pre-notice', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = sendPreNoticeSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input');
    }

    const { preNoticeMethod } = parsed.data;

    const adverseAction = await prisma.adverseAction.findFirst({
      where: { id, order: { clientId: user.clientId } },
      include: { order: { include: { applicant: true } } },
    });

    if (!adverseAction) {
      return sendError(res, 404, 'NOT_FOUND', 'Adverse action not found');
    }

    if (adverseAction.status !== 'initiated') {
      return sendError(res, 400, 'INVALID_STATUS', 'Adverse action must be in initiated status');
    }

    // Calculate waiting period (7 days from FCRA)
    const waitingPeriodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Update adverse action
    const updated = await prisma.adverseAction.update({
      where: { id },
      data: {
        status: 'pre_notice_sent',
        preNoticeSentAt: new Date(),
        preNoticeMethod,
        waitingPeriodEnd,
      },
    });

    // Create document record (in production, would generate actual PDF)
    await prisma.adverseActionDocument.create({
      data: {
        adverseActionId: id,
        documentType: 'pre_notice',
        filePath: '',
        sentTo: adverseAction.order.applicant?.email,
        sentAt: new Date(),
        deliveryStatus: 'sent',
      },
    });

    // Create timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: adverseAction.orderId,
        status: 'pre_notice_sent',
        description: `Pre-adverse action notice sent via ${preNoticeMethod}`,
        createdBy: user.email,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'pre_notice_sent',
        resourceType: 'adverse_action',
        resourceId: id,
      },
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/adverse-actions/:id/candidate-response - Record candidate's response
router.post('/:id/candidate-response', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = candidateResponseSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input');
    }

    const { response, disputeDetails, notes } = parsed.data;

    const adverseAction = await prisma.adverseAction.findFirst({
      where: { id, order: { clientId: user.clientId } },
    });

    if (!adverseAction) {
      return sendError(res, 404, 'NOT_FOUND', 'Adverse action not found');
    }

    if (adverseAction.status !== 'waiting_period') {
      return sendError(res, 400, 'INVALID_STATUS', 'Must be in waiting period to receive response');
    }

    const updated = await prisma.adverseAction.update({
      where: { id },
      data: {
        status: 'candidate_responded',
        candidateResponse: response === 'dispute' ? `dispute: ${disputeDetails}` : response,
        candidateResponseAt: new Date(),
      },
    });

    // Create timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: adverseAction.orderId,
        status: 'candidate_response',
        description: `Candidate responded: ${response}${disputeDetails ? ` - ${disputeDetails}` : ''}`,
        notes,
        createdBy: user.email,
      },
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/adverse-actions/:id/send-final-notice - Send final adverse action notice
router.post('/:id/send-final-notice', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const adverseAction = await prisma.adverseAction.findFirst({
      where: { id, order: { clientId: user.clientId } },
      include: { order: { include: { applicant: true } } },
    });

    if (!adverseAction) {
      return sendError(res, 404, 'NOT_FOUND', 'Adverse action not found');
    }

    if (!['pre_notice_sent', 'candidate_responded'].includes(adverseAction.status)) {
      return sendError(res, 400, 'INVALID_STATUS', 'Pre-notice must be sent before final notice');
    }

    // Update adverse action
    const updated = await prisma.adverseAction.update({
      where: { id },
      data: {
        status: 'final_notice_sent',
        finalNoticeSentAt: new Date(),
      },
    });

    // Create document record
    await prisma.adverseActionDocument.create({
      data: {
        adverseActionId: id,
        documentType: 'final_notice',
        filePath: '',
        sentTo: adverseAction.order.applicant?.email,
        sentAt: new Date(),
        deliveryStatus: 'sent',
      },
    });

    // Create timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: adverseAction.orderId,
        status: 'final_notice_sent',
        description: 'Final adverse action notice sent',
        createdBy: user.email,
      },
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/adverse-actions/:id/final-decision - Record final decision
router.post('/:id/final-decision', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = finalDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input');
    }

    const { decision, notes } = parsed.data;

    const adverseAction = await prisma.adverseAction.findFirst({
      where: { id, order: { clientId: user.clientId } },
    });

    if (!adverseAction) {
      return sendError(res, 404, 'NOT_FOUND', 'Adverse action not found');
    }

    if (adverseAction.status !== 'final_notice_sent') {
      return sendError(res, 400, 'INVALID_STATUS', 'Final notice must be sent before recording decision');
    }

    const updated = await prisma.adverseAction.update({
      where: { id },
      data: {
        status: 'completed',
        finalDecision: decision,
      },
    });

    // Update order status based on decision
    let newOrderStatus: string;
    let orderDescription: string;
    
    switch (decision) {
      case 'proceed':
        newOrderStatus = 'completed';
        orderDescription = 'Adverse action completed - proceeding with employment';
        break;
      case 'withdraw':
        newOrderStatus = 'cancelled';
        orderDescription = 'Adverse action completed - offer withdrawn';
        break;
      case 'revise_offer':
        newOrderStatus = 'requires_action';
        orderDescription = 'Adverse action completed - offer revised, requires action';
        break;
    }

    await prisma.order.update({
      where: { id: adverseAction.orderId },
      data: { status: newOrderStatus as any },
    });

    // Create timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: adverseAction.orderId,
        status: 'adverse_action_completed',
        description: orderDescription,
        notes,
        createdBy: user.email,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'adverse_action_completed',
        resourceType: 'adverse_action',
        resourceId: id,
        requestDetails: { decision, notes },
      },
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/adverse-actions/:id/cancel - Cancel adverse action
router.post('/:id/cancel', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { reason } = req.body;

    const adverseAction = await prisma.adverseAction.findFirst({
      where: { id, order: { clientId: user.clientId } },
    });

    if (!adverseAction) {
      return sendError(res, 404, 'NOT_FOUND', 'Adverse action not found');
    }

    if (['cancelled', 'completed'].includes(adverseAction.status)) {
      return sendError(res, 400, 'INVALID_STATUS', 'Cannot cancel a completed or already cancelled adverse action');
    }

    const updated = await prisma.adverseAction.update({
      where: { id },
      data: {
        status: 'cancelled',
      },
    });

    // Restore order status
    await prisma.order.update({
      where: { id: adverseAction.orderId },
      data: { status: 'completed' },
    });

    // Timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: adverseAction.orderId,
        status: 'adverse_action_cancelled',
        description: reason || 'Adverse action cancelled',
        createdBy: user.email,
      },
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/adverse-actions/:id/documents - Upload document
router.post('/:id/documents', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = uploadDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input');
    }

    const { documentType } = parsed.data;

    const adverseAction = await prisma.adverseAction.findFirst({
      where: { id, order: { clientId: user.clientId } },
    });

    if (!adverseAction) {
      return sendError(res, 404, 'NOT_FOUND', 'Adverse action not found');
    }

    // Multer handles file upload
    const uploadSingle = (await import('../middleware/upload')).uploadSingle;
    uploadSingle(req, res, async (err: any) => {
      if (err) {
        return sendError(res, 400, 'UPLOAD_ERROR', err.message || 'File upload failed');
      }

      const file = req.file;
      if (!file) {
        return sendError(res, 400, 'NO_FILE', 'No file uploaded');
      }

      const document = await prisma.adverseActionDocument.create({
        data: {
          adverseActionId: id,
          documentType,
          filePath: file.path,
        },
      });

      return sendSuccess(res, document, 201);
    });
  } catch (error) {
    next(error);
  }
});

export default router;
