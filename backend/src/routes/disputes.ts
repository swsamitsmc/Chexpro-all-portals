import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requirePermission, requireRoles } from '../middleware/rbac';
import { sendSuccess, sendError } from '../utils/response';
import { sendEmail } from '../utils/email';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ============================================================
// PUBLIC DISPUTE SUBMISSION (no auth required)
// ============================================================

// POST /api/v1/public/disputes - Submit dispute (public, no auth required)
router.post('/public/disputes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      applicantToken: z.string().min(1),
      reason: z.string().min(1),
      description: z.string().min(10),
      contactEmail: z.string().email(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const { applicantToken, reason, description, contactEmail } = parsed.data;

    // Find applicant by invitation token
    const applicant = await prisma.applicant.findFirst({
      where: { invitationToken: applicantToken },
      include: {
        orders: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { client: true }
        }
      }
    });

    if (!applicant) {
      return sendError(res, 404, 'INVALID_TOKEN', 'Invalid applicant token');
    }

    const order = applicant.orders[0];

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        orderId: order?.id,
        applicantId: applicant.id,
        disputeReason: reason,
        status: 'submitted',
      },
    });

    // Create initial communication record
    await prisma.disputeCommunication.create({
      data: {
        disputeId: dispute.id,
        fromParty: 'applicant',
        message: description,
      },
    });

    // Notify the client
    if (order?.client?.email) {
      try {
        await sendEmail({
          to: order.client.email,
          subject: `New Dispute Submitted - Order ${order.orderNumber || order.id}`,
          html: `<p>A dispute has been submitted by an applicant for order <strong>${order.orderNumber || order.id}</strong>.</p><p><strong>Reason:</strong> ${reason}</p><p>Please log in to your ChexPro portal to review and respond.</p>`,
          text: `A dispute has been submitted for order ${order.orderNumber || order.id}. Reason: ${reason}`,
        });
      } catch (emailErr) {
        console.error('Failed to send dispute notification email:', emailErr);
      }
    }

    // Add audit log
    await prisma.auditLog.create({
      data: {
        action: 'dispute_submitted',
        resourceType: 'dispute',
        resourceId: dispute.id,
        requestDetails: { reason, submittedBy: 'applicant' },
      },
    });

    return sendSuccess(res, {
      disputeId: dispute.id,
      referenceNumber: dispute.id.slice(0, 8).toUpperCase(),
      message: 'Your dispute has been submitted. You will be contacted at ' + contactEmail,
    }, 201);
  } catch (error) {
    next(error);
  }
});

// Apply authentication to all other routes
router.use(authenticate as any);

// Zod schemas
const createDisputeSchema = z.object({
  orderId: z.string().uuid(),
  disputedSection: z.string().optional(),
  disputeReason: z.string().min(1),
});

const updateDisputeSchema = z.object({
  status: z.enum(['submitted', 'under_review', 'resolved', 'closed']).optional(),
  assignedTo: z.string().uuid().optional(),
  resolutionNotes: z.string().optional(),
});

const addCommunicationSchema = z.object({
  message: z.string().min(1),
  attachments: z.array(z.string()).optional(),
});

// ============================================================
// INTERNAL DISPUTE MANAGEMENT
// ============================================================

// GET /api/v1/disputes - List all disputes for client
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
      prisma.dispute.findMany({
        where,
        include: {
          order: { select: { id: true, orderNumber: true, positionTitle: true } },
          applicant: { select: { firstName: true, lastName: true, email: true } },
          assignedUser: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { communications: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.dispute.count({ where }),
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

// GET /api/v1/disputes/:id - Get single dispute
router.get('/:id', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const dispute = await prisma.dispute.findFirst({
      where: { id, order: { clientId: user.clientId } },
      include: {
        order: { 
          include: { 
            package: { select: { name: true } },
            applicant: true,
          } 
        },
        applicant: true,
        assignedUser: { select: { firstName: true, lastName: true, email: true } },
        communications: {
          orderBy: { sentAt: 'asc' },
        },
      },
    });

    if (!dispute) {
      return sendError(res, 404, 'NOT_FOUND', 'Dispute not found');
    }

    return sendSuccess(res, dispute);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/disputes/:id - Update dispute (assign, change status)
router.put('/:id', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = updateDisputeSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input');
    }

    const dispute = await prisma.dispute.findFirst({
      where: { id, order: { clientId: user.clientId } },
    });

    if (!dispute) {
      return sendError(res, 404, 'NOT_FOUND', 'Dispute not found');
    }

    const { status, assignedTo, resolutionNotes } = parsed.data;

    // Handle assignment
    if (assignedTo) {
      const assignee = await prisma.user.findFirst({
        where: { id: assignedTo, clientId: user.clientId },
      });

      if (!assignee) {
        return sendError(res, 404, 'NOT_FOUND', 'Assignee not found');
      }
    }

    // Handle status change to resolved
    let resolvedAt = undefined;
    if (status === 'resolved' && dispute.status !== 'resolved') {
      resolvedAt = new Date();
    }

    const updated = await prisma.dispute.update({
      where: { id },
      data: {
        ...parsed.data,
        resolvedAt,
      },
    });

    // Create timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: dispute.orderId,
        status: 'dispute_updated',
        description: `Dispute ${status ? `status changed to ${status}` : 'updated'}`,
        createdBy: user.email,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'dispute_updated',
        resourceType: 'dispute',
        resourceId: id,
        requestDetails: parsed.data,
      },
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/disputes/:id/communications - Add internal communication
router.post('/:id/communications', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = addCommunicationSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input');
    }

    const dispute = await prisma.dispute.findFirst({
      where: { id, order: { clientId: user.clientId } },
    });

    if (!dispute) {
      return sendError(res, 404, 'NOT_FOUND', 'Dispute not found');
    }

    const communication = await prisma.disputeCommunication.create({
      data: {
        disputeId: id,
        fromParty: 'client',
        message: parsed.data.message,
        attachments: parsed.data.attachments,
      },
    });

    // Update dispute status if still submitted
    if (dispute.status === 'submitted') {
      await prisma.dispute.update({
        where: { id },
        data: { status: 'under_review' },
      });
    }

    return sendSuccess(res, communication, 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/disputes/stats - Get dispute statistics
router.get('/stats/summary', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const [total, open, resolved] = await Promise.all([
      prisma.dispute.count({ where: { order: { clientId: user.clientId } } }),
      prisma.dispute.count({ where: { order: { clientId: user.clientId }, status: { in: ['submitted', 'under_review'] } } }),
      prisma.dispute.count({ where: { order: { clientId: user.clientId }, status: 'resolved' } }),
    ]);

    // Calculate average resolution time manually
    const resolvedDisputes = await prisma.dispute.findMany({
      where: { order: { clientId: user.clientId }, status: 'resolved', resolvedAt: { not: null } },
      select: { submittedAt: true, resolvedAt: true },
    });

    let avgDays = 0;
    if (resolvedDisputes.length > 0) {
      const totalDays = resolvedDisputes.reduce((sum, d) => {
        const diff = d.resolvedAt!.getTime() - d.submittedAt.getTime();
        return sum + diff / (1000 * 60 * 60 * 24);
      }, 0);
      avgDays = Math.round(totalDays / resolvedDisputes.length);
    }

    return sendSuccess(res, {
      total,
      open,
      resolved: total - open,
      avgResolutionDays: avgDays,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// PUBLIC APPLICANT PORTAL DISPUTE SUBMISSION
// ============================================================

// POST /api/v1/disputes/public - Submit dispute (public, no auth required)
// Note: This is mounted separately - would need a separate router for /api/v1/public/disputes
// For now, we'll include it here but it requires a different route prefix

export default router;
