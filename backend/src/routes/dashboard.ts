import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { startOfMonth, endOfMonth, subDays } from 'date-fns';

const router = Router();

router.use(authenticate as any);

// GET /api/v1/dashboard/stats
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  const clientId = req.user!.clientId;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weekAgo = subDays(now, 7);

  const [total, pending, completedMonth, requiresAction, inProgressCount, weekCount] = await Promise.all([
    prisma.order.count({ where: { clientId } }),
    prisma.order.count({ where: { clientId, status: { in: ['submitted', 'data_verification', 'in_progress', 'pending_review'] } } }),
    prisma.order.count({ where: { clientId, status: 'completed', completedAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.order.count({ where: { clientId, status: 'requires_action' } }),
    prisma.order.count({ where: { clientId, status: 'in_progress' } }),
    prisma.order.count({ where: { clientId, createdAt: { gte: weekAgo } } }),
  ]);

  // Average turnaround
  const completedOrders = await prisma.order.findMany({
    where: { clientId, status: 'completed', submittedAt: { not: null }, completedAt: { not: null } },
    select: { submittedAt: true, completedAt: true },
    take: 100,
  });

  let avgTurnaround = 0;
  if (completedOrders.length > 0) {
    const totalHours = completedOrders.reduce((acc, o) => {
      const diff = (o.completedAt!.getTime() - o.submittedAt!.getTime()) / (1000 * 60 * 60);
      return acc + diff;
    }, 0);
    avgTurnaround = Math.round((totalHours / completedOrders.length / 24) * 10) / 10;
  }

  return sendSuccess(res, {
    totalOrders: total,
    pendingOrders: pending,
    completedThisMonth: completedMonth,
    requiresAction,
    inProgress: inProgressCount,
    ordersThisWeek: weekCount,
    averageTurnaroundDays: avgTurnaround,
  });
});

// GET /api/v1/dashboard/recent-orders
router.get('/recent-orders', async (req: AuthenticatedRequest, res: Response) => {
  const limit = Math.min(20, parseInt(String(req.query.limit ?? 5), 10));
  const orders = await prisma.order.findMany({
    where: { clientId: req.user!.clientId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    include: {
      applicant: { select: { firstName: true, lastName: true, email: true } },
      package: { select: { name: true } },
    },
  });
  return sendSuccess(res, orders);
});

// GET /api/v1/dashboard/activity-feed
router.get('/activity-feed', async (req: AuthenticatedRequest, res: Response) => {
  const limit = Math.min(50, parseInt(String(req.query.limit ?? 10), 10));
  const timeline = await prisma.orderTimeline.findMany({
    where: { order: { clientId: req.user!.clientId } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { order: { select: { orderNumber: true, applicant: { select: { firstName: true, lastName: true } } } } },
  });
  return sendSuccess(res, timeline);
});

// GET /api/v1/dashboard/alerts
router.get('/alerts', async (req: AuthenticatedRequest, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id, isRead: false },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return sendSuccess(res, notifications);
});

export default router;
