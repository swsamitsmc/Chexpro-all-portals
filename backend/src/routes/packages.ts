import { Router, Request, Response, NextFunction } from 'express';
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

const createPackageSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  services: z.array(z.string()).min(1), // Array of service IDs
  price: z.number().min(0),
  turnaroundTimeDays: z.number().int().min(1),
});

const updatePackageSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  services: z.array(z.string()).min(1).optional(),
  price: z.number().min(0).optional(),
  turnaroundTimeDays: z.number().int().min(1).optional(),
});

// ============================================================
// PACKAGE ROUTES
// ============================================================

// GET /api/v1/packages - List all packages for current client (global + client-specific)
router.get('/', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

    // Fetch both global packages (client_id = null) and client-specific packages
    const [globalPackages, clientPackages] = await Promise.all([
      prisma.package.findMany({
        where: { isActive: true, clientId: null },
        orderBy: { name: 'asc' },
      }),
      prisma.package.findMany({
        where: { clientId: user.clientId, isActive: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Combine and mark with isGlobal flag
    const packages = [
      ...globalPackages.map(pkg => ({ ...pkg, isGlobal: true })),
      ...clientPackages.map(pkg => ({ ...pkg, isGlobal: false })),
    ];

    const total = packages.length;
    const paginatedPackages = packages.slice(skip, skip + limit);

    return sendPaginated(res, paginatedPackages, total, page, limit);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/packages/:id - Get single package with its services
router.get('/:id', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const pkg = await prisma.package.findFirst({
      where: {
        id,
        isActive: true,
        OR: [
          { clientId: null },
          { clientId: user.clientId },
        ],
      },
    });

    if (!pkg) {
      return sendError(res, 404, 'NOT_FOUND', 'Package not found');
    }

    // Get service details from the services JSON array in package
    const serviceIds = pkg.services as string[];
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, isActive: true },
    });

    const isGlobal = pkg.clientId === null;

    return sendSuccess(res, { ...pkg, services, isGlobal });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/packages - Create package (admin/owner only)
router.post('/', requirePermission('client:admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = createPackageSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const { name, description, services, price, turnaroundTimeDays } = parsed.data;

    // Validate all service IDs exist
    const existingServices = await prisma.service.findMany({
      where: { id: { in: services }, isActive: true },
    });

    if (existingServices.length !== services.length) {
      return sendError(res, 400, 'INVALID_SERVICES', 'One or more services not found');
    }

    const pkg = await prisma.package.create({
      data: {
        name,
        description,
        services: services as unknown as any, // Cast to JSON
        price,
        turnaroundTimeDays,
        clientId: user.clientId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'package_create',
        resourceType: 'package',
        resourceId: pkg.id,
        requestDetails: { name, price, turnaroundTimeDays },
      },
    });

    return sendSuccess(res, { ...pkg, isGlobal: false }, 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/packages/:id - Update package (admin/owner only)
router.put('/:id', requirePermission('client:admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = updatePackageSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    // Check package exists and belongs to client (or is global but can be edited by any admin)
    const existing = await prisma.package.findFirst({
      where: {
        id,
        OR: [
          { clientId: user.clientId },
          { clientId: null }, // Global packages can be edited
        ],
      },
    });

    if (!existing) {
      return sendError(res, 404, 'NOT_FOUND', 'Package not found');
    }

    // If global package, only allow editing if user is owner
    if (existing.clientId === null && user.role !== 'owner') {
      return sendError(res, 403, 'FORBIDDEN', 'Only owners can edit global packages');
    }

    const { services, ...updateData } = parsed.data;

    // If services are being updated, validate them
    if (services) {
      const existingServices = await prisma.service.findMany({
        where: { id: { in: services }, isActive: true },
      });

      if (existingServices.length !== services.length) {
        return sendError(res, 400, 'INVALID_SERVICES', 'One or more services not found');
      }
    }

    const pkg = await prisma.package.update({
      where: { id },
      data: {
        ...updateData,
        ...(services && { services: services as unknown as any }),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'package_update',
        resourceType: 'package',
        resourceId: pkg.id,
        requestDetails: parsed.data,
      },
    });

    const isGlobal = pkg.clientId === null;
    return sendSuccess(res, { ...pkg, isGlobal });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/packages/:id - Soft delete (set is_active=false)
router.delete('/:id', requirePermission('client:admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const existing = await prisma.package.findFirst({
      where: {
        id,
        OR: [
          { clientId: user.clientId },
          { clientId: null },
        ],
      },
    });

    if (!existing) {
      return sendError(res, 404, 'NOT_FOUND', 'Package not found');
    }

    // If global package, only allow deleting if user is owner
    if (existing.clientId === null && user.role !== 'owner') {
      return sendError(res, 403, 'FORBIDDEN', 'Only owners can delete global packages');
    }

    const pkg = await prisma.package.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'package_delete',
        resourceType: 'package',
        resourceId: pkg.id,
      },
    });

    return sendSuccess(res, { message: 'Package deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/packages/calculate-price - Calculate dynamic pricing based on selected services
router.post('/calculate-price', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { serviceIds } = req.body as { serviceIds: string[] };

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'serviceIds array is required');
    }

    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, isActive: true },
    });

    if (services.length !== serviceIds.length) {
      return sendError(res, 400, 'INVALID_SERVICES', 'One or more services not found');
    }

    const totalPrice = services.reduce((sum, svc) => sum + Number(svc.basePrice), 0);
    const maxTurnaround = Math.max(...services.map(svc => svc.estimatedTurnaroundDays));

    // Check which services require SIN
    const requiresSin = services.some(svc => svc.requiresSin);

    return sendSuccess(res, {
      services: services.map(s => ({ id: s.id, name: s.name, price: s.basePrice })),
      totalPrice,
      turnaroundTimeDays: maxTurnaround,
      requiresSin,
      serviceCount: services.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
