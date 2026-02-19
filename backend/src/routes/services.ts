import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { parsePagination } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticate as any);

// ============================================================
// ZOD SCHEMAS
// ============================================================

const createServiceSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  description: z.string().optional(),
  basePrice: z.number().min(0),
  estimatedTurnaroundDays: z.number().int().min(1),
  requiresSin: z.boolean().optional(),
  vendorType: z.string().optional(),
});

const updateServiceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  basePrice: z.number().min(0).optional(),
  estimatedTurnaroundDays: z.number().int().min(1).optional(),
  requiresSin: z.boolean().optional(),
  vendorType: z.string().optional(),
});

// ============================================================
// SERVICE ROUTES
// ============================================================

// GET /api/v1/services - List all available services
router.get('/', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const { category, search } = req.query as Record<string, string>;

    const where: any = { isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.service.count({ where }),
    ]);

    return sendPaginated(res, services, total, page, limit);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/services/:id - Get single service detail
router.get('/:id', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service || !service.isActive) {
      return sendError(res, 404, 'NOT_FOUND', 'Service not found');
    }

    return sendSuccess(res, service);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/services - Create service (admin/owner only)
router.post('/', requirePermission('client:admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = createServiceSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const { name, category, description, basePrice, estimatedTurnaroundDays, requiresSin, vendorType } = parsed.data;

    const service = await prisma.service.create({
      data: {
        name,
        category,
        description,
        basePrice,
        estimatedTurnaroundDays,
        requiresSin: requiresSin ?? false,
        vendorType,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'service_create',
        resourceType: 'service',
        resourceId: service.id,
        requestDetails: { name, category, basePrice },
      },
    });

    return sendSuccess(res, service, 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/services/:id - Update service (admin/owner only)
router.put('/:id', requirePermission('client:admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = updateServiceSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const existing = await prisma.service.findUnique({ where: { id } });

    if (!existing) {
      return sendError(res, 404, 'NOT_FOUND', 'Service not found');
    }

    const service = await prisma.service.update({
      where: { id },
      data: parsed.data,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'service_update',
        resourceType: 'service',
        resourceId: service.id,
        requestDetails: parsed.data,
      },
    });

    return sendSuccess(res, service);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/services/:id - Soft delete service
router.delete('/:id', requirePermission('client:admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const existing = await prisma.service.findUnique({ where: { id } });

    if (!existing) {
      return sendError(res, 404, 'NOT_FOUND', 'Service not found');
    }

    const service = await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'service_delete',
        resourceType: 'service',
        resourceId: service.id,
      },
    });

    return sendSuccess(res, { message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
