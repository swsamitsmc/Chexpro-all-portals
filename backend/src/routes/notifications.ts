import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { parsePagination } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticate as any);

// GET /api/v1/notifications
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const { unreadOnly = 'false' } = req.query as Record<string, string>;

    const where: any = { userId: user.id };
    if (unreadOnly === 'true' || unreadOnly === true as any) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

    return sendSuccess(res, {
      notifications,
      unreadCount,
      total,
    }, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/notifications/:id/read
router.put('/:id/read', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    });

    if (!notification) {
      return sendError(res, 404, 'NOT_FOUND', 'Notification not found');
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return sendSuccess(res, { success: true });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/notifications/read-all
router.put('/read-all', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const result = await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return sendSuccess(res, { success: true, updated: result.count });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/notifications/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    });

    if (!notification) {
      return sendError(res, 404, 'NOT_FOUND', 'Notification not found');
    }

    await prisma.notification.delete({
      where: { id },
    });

    return sendSuccess(res, { success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/notifications - Create notification (internal use)
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, orderId, type, title, message } = req.body;

    if (!userId || !type || !title) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'userId, type, and title are required');
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        orderId: orderId || null,
        type,
        title,
        message: message || '',
      },
    });

    return sendSuccess(res, notification, 201);
  } catch (error) {
    next(error);
  }
});

export default router;
