import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { authenticateJWT } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// GET /api/v1/notifications
router.get('/', authenticateJWT, async (req, res: Response) => {
  try {
    const { unreadOnly, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const take = parseInt(limit as string, 10);

    const where: Record<string, unknown> = { userId: req.user!.id };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.notification.count({ where: { userId: req.user!.id } }),
      prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
    ]);

    res.json(successResponse({
      notifications,
      unreadCount,
      total,
    }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get notifications'));
  }
});

// PUT /api/v1/notifications/:id/read
router.put('/:id/read', authenticateJWT, async (req, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!notification) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Notification not found'));
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(successResponse(null, 'Notification marked as read'));
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to mark notification as read'));
  }
});

// PUT /api/v1/notifications/read-all
router.put('/read-all', authenticateJWT, async (req, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });

    res.json(successResponse(null, 'All notifications marked as read'));
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to mark all notifications as read'));
  }
});

// DELETE /api/v1/notifications/:id
router.delete('/:id', authenticateJWT, async (req, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!notification) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Notification not found'));
    }

    await prisma.notification.delete({ where: { id } });

    res.json(successResponse(null, 'Notification deleted'));
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to delete notification'));
  }
});

export default router;
