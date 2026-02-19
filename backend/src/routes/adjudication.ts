import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireRoles } from '../middleware/rbac';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Apply authentication to all routes
router.use(authenticate as any);

// Zod schemas
const createMatrixSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

const createRuleSchema = z.object({
  matrixId: z.string().uuid(),
  ruleOrder: z.number().int().positive(),
  positionCategory: z.string().optional(),
  offenseType: z.string().optional(),
  severity: z.enum(['minor', 'moderate', 'major', 'critical']).optional(),
  lookbackYears: z.number().int().min(0).optional(),
  decision: z.enum(['auto_approve', 'auto_reject', 'manual_review', 'conditional']),
  conditions: z.record(z.any()).optional(),
  notes: z.string().optional(),
});

const updateRuleSchema = z.object({
  ruleOrder: z.number().int().positive().optional(),
  positionCategory: z.string().optional(),
  offenseType: z.string().optional(),
  severity: z.enum(['minor', 'moderate', 'major', 'critical']).optional(),
  lookbackYears: z.number().int().min(0).optional(),
  decision: z.enum(['auto_approve', 'auto_reject', 'manual_review', 'conditional']).optional(),
  conditions: z.record(z.any()).optional(),
  notes: z.string().optional(),
});

const manualDecisionSchema = z.object({
  decision: z.enum(['auto_approve', 'auto_reject', 'manual_review', 'conditional']),
  notes: z.string().optional(),
});

const runAdjudicationSchema = z.object({
  orderId: z.string().uuid(),
  matrixId: z.string().uuid().optional(),
});

// ============================================================
// MATRIX MANAGEMENT
// ============================================================

// GET /api/v1/adjudication/matrices - List all matrices for client
router.get('/matrices', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { active } = req.query;

    const where: any = { clientId: user.clientId };
    if (active !== undefined) where.isActive = active === 'true';

    const matrices = await prisma.adjudicationMatrix.findMany({
      where,
      include: {
        _count: { select: { rules: true, adjudications: true } },
        createdByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, matrices);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/adjudication/matrices/:id - Get single matrix with rules
router.get('/matrices/:id', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const matrix = await prisma.adjudicationMatrix.findFirst({
      where: { id, clientId: user.clientId },
      include: {
        rules: { orderBy: { ruleOrder: 'asc' } },
        createdByUser: { select: { firstName: true, lastName: true } },
      },
    });

    if (!matrix) {
      return sendError(res, 404, 'NOT_FOUND', 'Adjudication matrix not found');
    }

    return sendSuccess(res, matrix);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/adjudication/matrices - Create new matrix
router.post('/matrices', requireRoles('owner', 'admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = createMatrixSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const { name, description, isActive } = parsed.data;

    const matrix = await prisma.adjudicationMatrix.create({
      data: {
        clientId: user.clientId,
        name,
        description,
        isActive,
        createdBy: user.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'matrix_created',
        resourceType: 'adjudication_matrix',
        resourceId: matrix.id,
        requestDetails: { name },
      },
    });

    return sendSuccess(res, matrix, 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/adjudication/matrices/:id - Update matrix
router.put('/matrices/:id', requireRoles('owner', 'admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = createMatrixSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input');
    }

    const matrix = await prisma.adjudicationMatrix.findFirst({
      where: { id, clientId: user.clientId },
    });

    if (!matrix) {
      return sendError(res, 404, 'NOT_FOUND', 'Adjudication matrix not found');
    }

    const updated = await prisma.adjudicationMatrix.update({
      where: { id },
      data: parsed.data,
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/adjudication/matrices/:id - Delete matrix (soft delete)
router.delete('/matrices/:id', requireRoles('owner', 'admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const matrix = await prisma.adjudicationMatrix.findFirst({
      where: { id, clientId: user.clientId },
    });

    if (!matrix) {
      return sendError(res, 404, 'NOT_FOUND', 'Adjudication matrix not found');
    }

    // Soft delete - set isActive to false
    await prisma.adjudicationMatrix.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'matrix_deleted',
        resourceType: 'adjudication_matrix',
        resourceId: id,
      },
    });

    return sendSuccess(res, { message: 'Matrix deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// RULE MANAGEMENT
// ============================================================

// GET /api/v1/adjudication/rules/:matrixId - Get rules for a matrix
router.get('/rules/:matrixId', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { matrixId } = req.params;

    const matrix = await prisma.adjudicationMatrix.findFirst({
      where: { id: matrixId, clientId: user.clientId },
    });

    if (!matrix) {
      return sendError(res, 404, 'NOT_FOUND', 'Adjudication matrix not found');
    }

    const rules = await prisma.adjudicationRule.findMany({
      where: { matrixId },
      orderBy: { ruleOrder: 'asc' },
    });

    return sendSuccess(res, rules);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/adjudication/rules - Create rule
router.post('/rules', requireRoles('owner', 'admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = createRuleSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const { matrixId, ruleOrder, positionCategory, offenseType, severity, lookbackYears, decision, conditions, notes } = parsed.data;

    // Verify matrix belongs to client
    const matrix = await prisma.adjudicationMatrix.findFirst({
      where: { id: matrixId, clientId: user.clientId },
    });

    if (!matrix) {
      return sendError(res, 404, 'NOT_FOUND', 'Adjudication matrix not found');
    }

    const rule = await prisma.adjudicationRule.create({
      data: {
        matrixId,
        ruleOrder,
        positionCategory,
        offenseType,
        severity,
        lookbackYears,
        decision,
        conditions,
        notes,
      },
    });

    return sendSuccess(res, rule, 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/adjudication/rules/:id - Update rule
router.put('/rules/:id', requireRoles('owner', 'admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = updateRuleSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input');
    }

    // Verify rule belongs to client's matrix
    const rule = await prisma.adjudicationRule.findFirst({
      where: { id },
      include: { matrix: true },
    });

    if (!rule || rule.matrix.clientId !== user.clientId) {
      return sendError(res, 404, 'NOT_FOUND', 'Rule not found');
    }

    const updated = await prisma.adjudicationRule.update({
      where: { id },
      data: parsed.data,
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/adjudication/rules/:id - Delete rule
router.delete('/rules/:id', requireRoles('owner', 'admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const rule = await prisma.adjudicationRule.findFirst({
      where: { id },
      include: { matrix: true },
    });

    if (!rule || rule.matrix.clientId !== user.clientId) {
      return sendError(res, 404, 'NOT_FOUND', 'Rule not found');
    }

    await prisma.adjudicationRule.delete({ where: { id } });

    return sendSuccess(res, { message: 'Rule deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// ORDER ADJUDICATION
// ============================================================

// POST /api/v1/adjudication/run - Run adjudication on an order
router.post('/run', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = runAdjudicationSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input');
    }

    const { orderId, matrixId } = parsed.data;

    // Verify order belongs to client
    const order = await prisma.order.findFirst({
      where: { id: orderId, clientId: user.clientId },
      include: { applicant: true },
    });

    if (!order) {
      return sendError(res, 404, 'NOT_FOUND', 'Order not found');
    }

    // Get matrix - use provided or find active one
    let matrix;
    if (matrixId) {
      matrix = await prisma.adjudicationMatrix.findFirst({
        where: { id: matrixId, clientId: user.clientId, isActive: true },
        include: { rules: { orderBy: { ruleOrder: 'asc' } } },
      });
    } else {
      matrix = await prisma.adjudicationMatrix.findFirst({
        where: { clientId: user.clientId, isActive: true },
        include: { rules: { orderBy: { ruleOrder: 'asc' } } },
      });
    }

    if (!matrix) {
      return sendError(res, 404, 'NO_MATRIX', 'No active adjudication matrix found');
    }

    // Apply rules to determine decision
    const reasoning: any[] = [];
    let automatedDecision: string = 'auto_approve';

    for (const rule of matrix.rules) {
      // Check if rule applies based on position category (if specified)
      if (rule.positionCategory && order.positionTitle) {
        if (!order.positionTitle.toLowerCase().includes(rule.positionCategory.toLowerCase())) {
          continue;
        }
      }

      // Apply rule
      reasoning.push({
        ruleId: rule.id,
        ruleOrder: rule.ruleOrder,
        offenseType: rule.offenseType,
        severity: rule.severity,
        decision: rule.decision,
        applied: true,
      });

      if (rule.decision === 'auto_reject') {
        automatedDecision = 'auto_reject';
        break;
      } else if (rule.decision === 'manual_review') {
        automatedDecision = 'manual_review';
        // Don't break - keep checking for more severe rules
      } else if (rule.decision === 'conditional') {
        automatedDecision = 'conditional';
      }
    }

    // Create or update order adjudication
    const adjudication = await prisma.orderAdjudication.upsert({
      where: { orderId },
      create: {
        orderId,
        matrixId: matrix.id,
        automatedDecision,
        decisionReasoning: reasoning,
        manualOverride: false,
        finalDecision: automatedDecision,
        decidedAt: new Date(),
      },
      update: {
        matrixId: matrix.id,
        automatedDecision,
        decisionReasoning: reasoning,
        manualOverride: false,
        finalDecision: automatedDecision,
        decidedAt: new Date(),
      },
    });

    // Update order status if manual review needed
    if (automatedDecision === 'manual_review') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'pending_review' },
      });

      await prisma.orderTimeline.create({
        data: {
          orderId,
          status: 'pending_adjudication',
          description: 'Order flagged for manual review by adjudication matrix',
          createdBy: user.email,
        },
      });
    }

    // Timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId,
        status: 'adjudication_run',
        description: `Adjudication run using matrix "${matrix.name}": ${automatedDecision}`,
        createdBy: user.email,
      },
    });

    return sendSuccess(res, {
      adjudication,
      matrix: { id: matrix.id, name: matrix.name },
      reasoning,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/adjudication/order/:orderId - Get adjudication for an order
router.get('/order/:orderId', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: { id: orderId, clientId: user.clientId },
    });

    if (!order) {
      return sendError(res, 404, 'NOT_FOUND', 'Order not found');
    }

    const adjudication = await prisma.orderAdjudication.findUnique({
      where: { orderId },
      include: {
        matrix: true,
        manualDecidedBy: { select: { firstName: true, lastName: true } },
      },
    });

    return sendSuccess(res, adjudication);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/adjudication/order/:orderId/override - Manual override
router.post('/order/:orderId/override', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { orderId } = req.params;
    const parsed = manualDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input');
    }

    const { decision, notes } = parsed.data;

    // Verify order belongs to client
    const order = await prisma.order.findFirst({
      where: { id: orderId, clientId: user.clientId },
    });

    if (!order) {
      return sendError(res, 404, 'NOT_FOUND', 'Order not found');
    }

    const updated = await prisma.orderAdjudication.update({
      where: { orderId },
      data: {
        manualOverride: true,
        manualDecision: decision,
        manualDecisionBy: user.id,
        manualDecisionNotes: notes,
        finalDecision: decision,
        decidedAt: new Date(),
      },
    });

    // Update order status based on decision
    let newOrderStatus: string;
    switch (decision) {
      case 'auto_approve':
        newOrderStatus = 'completed';
        break;
      case 'auto_reject':
        newOrderStatus = 'requires_action';
        break;
      case 'manual_review':
        newOrderStatus = 'pending_review';
        break;
      case 'conditional':
        newOrderStatus = 'requires_action';
        break;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: newOrderStatus as any },
    });

    // Timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId,
        status: 'adjudication_override',
        description: `Manual override: ${decision}`,
        notes,
        createdBy: user.email,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'adjudication_override',
        resourceType: 'order_adjudication',
        resourceId: orderId,
        requestDetails: { decision, notes },
      },
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/adjudication/pending - List orders pending manual review
router.get('/pending', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const adjudications = await prisma.orderAdjudication.findMany({
      where: {
        finalDecision: 'manual_review',
        order: { clientId: user.clientId, status: 'pending_review' },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            positionTitle: true,
            status: true,
            createdAt: true,
            applicant: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        matrix: { select: { name: true } },
      },
      orderBy: { decidedAt: 'asc' },
    });

    return sendSuccess(res, adjudications);
  } catch (error) {
    next(error);
  }
});

export default router;
