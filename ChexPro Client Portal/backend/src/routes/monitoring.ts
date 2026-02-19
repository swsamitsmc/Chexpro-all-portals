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
const enrollSchema = z.object({
  applicantId: z.string().uuid(),
  originalOrderId: z.string().uuid().optional(),
  monitoringType: z.enum(['continuous', 'periodic']),
  monitoringScope: z.record(z.any()).optional(),
  frequency: z.string().optional(),
  employeeId: z.string().optional(),
});

const updateEnrollmentSchema = z.object({
  status: z.enum(['active', 'paused', 'cancelled']).optional(),
  frequency: z.string().optional(),
  monitoringScope: z.record(z.any()).optional(),
});

const reviewAlertSchema = z.object({
  status: z.enum(['reviewed', 'dismissed', 'actioned']),
  actionTaken: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================
// ENROLLMENT MANAGEMENT
// ============================================================

// GET /api/v1/monitoring/enrollments - List all enrollments
router.get('/enrollments', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { status, page = '1', limit = '20' } = req.query;

    const where: any = { clientId: user.clientId };
    if (status) where.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [items, total] = await Promise.all([
      prisma.monitoringEnrollment.findMany({
        where,
        include: {
          applicant: { select: { firstName: true, lastName: true, email: true } },
          originalOrderId: true,
          _count: { select: { alerts: true } },
        } as any,
        orderBy: { enrolledAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.monitoringEnrollment.count({ where }),
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

// GET /api/v1/monitoring/enrollments/:id - Get single enrollment
router.get('/enrollments/:id', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const enrollment = await prisma.monitoringEnrollment.findFirst({
      where: { id, clientId: user.clientId },
      include: {
        applicant: true,
        originalOrder: true,
        alerts: {
          orderBy: { createdAt: 'desc' },
          include: { reviewedByUser: { select: { firstName: true, lastName: true } } },
        },
      } as any,
    });

    if (!enrollment) {
      return sendError(res, 404, 'NOT_FOUND', 'Monitoring enrollment not found');
    }

    return sendSuccess(res, enrollment);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/monitoring/enrollments - Create enrollment
router.post('/enrollments', requirePermission('orders:create') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const parsed = enrollSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
    }

    const { applicantId, originalOrderId, monitoringType, monitoringScope, frequency, employeeId } = parsed.data;

    // Verify applicant exists and belongs to client's orders
    const applicant = await prisma.applicant.findFirst({
      where: { 
        id: applicantId,
        orders: { some: { clientId: user.clientId } },
      },
    });

    if (!applicant) {
      return sendError(res, 404, 'NOT_FOUND', 'Applicant not found');
    }

    // Check if already enrolled
    const existing = await prisma.monitoringEnrollment.findFirst({
      where: { applicantId, status: { notIn: ['cancelled'] } },
    });

    if (existing) {
      return sendError(res, 400, 'ALREADY_ENROLLED', 'Applicant is already enrolled in monitoring');
    }

    // Calculate next check date
    let nextCheckAt: Date | null = null;
    if (monitoringType === 'periodic' && frequency) {
      const months = parseInt(frequency.replace('months', '')) || 1;
      nextCheckAt = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
    }

    const enrollment = await prisma.monitoringEnrollment.create({
      data: {
        clientId: user.clientId,
        applicantId,
        originalOrderId,
        monitoringType,
        monitoringScope,
        frequency,
        employeeId,
        nextCheckAt,
        status: 'active',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'monitoring_enrolled',
        resourceType: 'monitoring_enrollment',
        resourceId: enrollment.id,
        requestDetails: { applicantId, monitoringType, employeeId },
      },
    });

    return sendSuccess(res, enrollment, 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/monitoring/enrollments/:id - Update enrollment
router.put('/enrollments/:id', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = updateEnrollmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input');
    }

    const enrollment = await prisma.monitoringEnrollment.findFirst({
      where: { id, clientId: user.clientId },
    });

    if (!enrollment) {
      return sendError(res, 404, 'NOT_FOUND', 'Monitoring enrollment not found');
    }

    const updated = await prisma.monitoringEnrollment.update({
      where: { id },
      data: parsed.data,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'monitoring_updated',
        resourceType: 'monitoring_enrollment',
        resourceId: id,
        requestDetails: parsed.data,
      },
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/monitoring/enrollments/:id - Cancel enrollment
router.delete('/enrollments/:id', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const enrollment = await prisma.monitoringEnrollment.findFirst({
      where: { id, clientId: user.clientId },
    });

    if (!enrollment) {
      return sendError(res, 404, 'NOT_FOUND', 'Monitoring enrollment not found');
    }

    await prisma.monitoringEnrollment.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'monitoring_cancelled',
        resourceType: 'monitoring_enrollment',
        resourceId: id,
      },
    });

    return sendSuccess(res, { message: 'Monitoring enrollment cancelled' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// ALERTS MANAGEMENT
// ============================================================

// GET /api/v1/monitoring/alerts - List all alerts
router.get('/alerts', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { status, severity, enrollmentId, page = '1', limit = '20' } = req.query;

    const where: any = {
      enrollment: { clientId: user.clientId },
    };
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (enrollmentId) where.enrollmentId = enrollmentId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [items, total] = await Promise.all([
      prisma.monitoringAlert.findMany({
        where,
        include: {
          enrollment: {
            include: {
              applicant: { select: { firstName: true, lastName: true, email: true } },
              originalOrderId: true,
            },
          },
          reviewedByUser: { select: { firstName: true, lastName: true } },
        } as any,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.monitoringAlert.count({ where }),
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

// GET /api/v1/monitoring/alerts/:id - Get single alert
router.get('/alerts/:id', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const alert = await prisma.monitoringAlert.findFirst({
      where: { id, enrollment: { clientId: user.clientId } },
      include: {
        enrollment: {
          include: {
            applicant: true,
          },
        },
        reviewedByUser: { select: { firstName: true, lastName: true } },
      },
    });

    if (!alert) {
      return sendError(res, 404, 'NOT_FOUND', 'Alert not found');
    }

    return sendSuccess(res, alert);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/monitoring/alerts/:id/review - Review alert
router.post('/alerts/:id/review', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const parsed = reviewAlertSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input');
    }

    const { status, actionTaken, notes } = parsed.data;

    const alert = await prisma.monitoringAlert.findFirst({
      where: { id, enrollment: { clientId: user.clientId } },
    });

    if (!alert) {
      return sendError(res, 404, 'NOT_FOUND', 'Alert not found');
    }

    if (alert.status !== 'new') {
      return sendError(res, 400, 'INVALID_STATUS', 'Alert has already been reviewed');
    }

    const updated = await prisma.monitoringAlert.update({
      where: { id },
      data: {
        status,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        actionTaken,
      },
    });

    // Create timeline entry for the enrollment's order
    const enrollment = await prisma.monitoringEnrollment.findUnique({
      where: { id: alert.enrollmentId },
    });
    
    if (enrollment?.originalOrderId) {
      await prisma.orderTimeline.create({
        data: {
          orderId: enrollment.originalOrderId,
          status: 'monitoring_alert_reviewed',
          description: `Monitoring alert reviewed: ${alert.alertType} - ${status}`,
          notes,
          createdBy: user.email,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'alert_reviewed',
        resourceType: 'monitoring_alert',
        resourceId: id,
        requestDetails: { status, actionTaken, notes },
      },
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/monitoring/alerts/critical - Get critical alerts count
router.get('/alerts/critical', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const count = await prisma.monitoringAlert.count({
      where: {
        enrollment: { clientId: user.clientId },
        status: 'new',
        severity: 'critical',
      },
    });

    return sendSuccess(res, { count });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// SCHEDULES MANAGEMENT
// ============================================================

// GET /api/v1/monitoring/schedules - List rescreening schedules
router.get('/schedules', requirePermission('orders:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const schedules = await prisma.rescreeningSchedule.findMany({
      where: { clientId: user.clientId, isActive: true },
      include: {
        package: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, schedules);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/monitoring/schedules - Create rescreening schedule
router.post('/schedules', requireRoles('owner', 'admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { positionCategory, frequencyMonths, autoInitiate, packageId } = req.body;

    if (!frequencyMonths || frequencyMonths < 1) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'frequencyMonths is required');
    }

    const schedule = await prisma.rescreeningSchedule.create({
      data: {
        clientId: user.clientId,
        positionCategory,
        frequencyMonths,
        autoInitiate: autoInitiate || false,
        packageId,
        isActive: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'schedule_created',
        resourceType: 'rescreening_schedule',
        resourceId: schedule.id,
        requestDetails: { positionCategory, frequencyMonths, autoInitiate },
      },
    });

    return sendSuccess(res, schedule, 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/monitoring/schedules/:id - Update rescreening schedule
router.put('/schedules/:id', requireRoles('owner', 'admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { positionCategory, frequencyMonths, autoInitiate, packageId, isActive } = req.body;

    const schedule = await prisma.rescreeningSchedule.findFirst({
      where: { id, clientId: user.clientId },
    });

    if (!schedule) {
      return sendError(res, 404, 'NOT_FOUND', 'Schedule not found');
    }

    const updated = await prisma.rescreeningSchedule.update({
      where: { id },
      data: {
        ...(positionCategory !== undefined && { positionCategory }),
        ...(frequencyMonths !== undefined && { frequencyMonths }),
        ...(autoInitiate !== undefined && { autoInitiate }),
        ...(packageId !== undefined && { packageId }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/monitoring/schedules/:id - Delete rescreening schedule
router.delete('/schedules/:id', requireRoles('owner', 'admin') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const schedule = await prisma.rescreeningSchedule.findFirst({
      where: { id, clientId: user.clientId },
    });

    if (!schedule) {
      return sendError(res, 404, 'NOT_FOUND', 'Schedule not found');
    }

    // Soft delete
    await prisma.rescreeningSchedule.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        clientId: user.clientId,
        action: 'schedule_deleted',
        resourceType: 'rescreening_schedule',
        resourceId: id,
      },
    });

    return sendSuccess(res, { message: 'Schedule deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
