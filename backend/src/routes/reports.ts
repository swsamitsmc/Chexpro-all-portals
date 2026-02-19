import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { sendSuccess, sendError } from '../utils/response';
import { parsePagination } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';

const router = Router();
router.use(authenticate as any);

// Helper to parse date params
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// GET /api/v1/reports/order-volume
router.get('/order-volume', requirePermission('analytics:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { startDate, endDate, groupBy = 'day' } = req.query as Record<string, string>;

    const start = parseDate(startDate) || subDays(new Date(), 30);
    const end = parseDate(endDate) || new Date();

    // Get orders for this client
    const orders = await prisma.order.findMany({
      where: {
        clientId: user.clientId,
        createdAt: { gte: start, lte: end },
      },
      select: { createdAt: true },
    });

    // Group by day/week/month
    let labels: string[] = [];
    let data: number[] = [];

    if (groupBy === 'day') {
      const days = eachDayOfInterval({ start, end });
      labels = days.map(d => format(d, 'yyyy-MM-dd'));
      data = labels.map(label => orders.filter(o => format(o.createdAt, 'yyyy-MM-dd') === label).length);
    } else if (groupBy === 'week') {
      // Simplified weekly grouping
      const weeks: Record<string, number> = {};
      orders.forEach(o => {
        const weekStart = format(startOfWeek(o.createdAt), 'yyyy-MM-dd');
        weeks[weekStart] = (weeks[weekStart] || 0) + 1;
      });
      labels = Object.keys(weeks).sort();
      data = labels.map(l => weeks[l]);
    } else if (groupBy === 'month') {
      const months: Record<string, number> = {};
      orders.forEach(o => {
        const month = format(o.createdAt, 'yyyy-MM');
        months[month] = (months[month] || 0) + 1;
      });
      labels = Object.keys(months).sort();
      data = labels.map(l => months[l]);
    }

    return sendSuccess(res, { labels, data });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reports/turnaround-time
router.get('/turnaround-time', requirePermission('analytics:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { startDate, endDate, groupBy = 'overall' } = req.query as Record<string, string>;

    const start = parseDate(startDate) || subDays(new Date(), 30);
    const end = parseDate(endDate) || new Date();

    // Get completed orders with submitted and completed dates
    const orders = await prisma.order.findMany({
      where: {
        clientId: user.clientId,
        status: 'completed',
        submittedAt: { not: null },
        completedAt: { not: null, gte: start, lte: end },
      },
      select: {
        submittedAt: true,
        completedAt: true,
        package: { select: { name: true } },
      },
    });

    if (orders.length === 0) {
      return sendSuccess(res, { average: 0, breakdown: [] });
    }

    // Calculate overall average
    const totalDays = orders.reduce((sum, o) => {
      const days = (o.completedAt!.getTime() - o.submittedAt!.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    const overallAverage = totalDays / orders.length;

    if (groupBy === 'overall') {
      return sendSuccess(res, { average: parseFloat(overallAverage.toFixed(1)), breakdown: [] });
    }

    // Breakdown by service or package
    const breakdownMap: Record<string, { total: number; count: number }> = {};

    orders.forEach(o => {
      const name = o.package?.name || 'Custom';
      if (!breakdownMap[name]) {
        breakdownMap[name] = { total: 0, count: 0 };
      }
      const days = (o.completedAt!.getTime() - o.submittedAt!.getTime()) / (1000 * 60 * 60 * 24);
      breakdownMap[name].total += days;
      breakdownMap[name].count += 1;
    });

    const breakdown = Object.entries(breakdownMap).map(([name, { total, count }]) => ({
      name,
      avgDays: parseFloat((total / count).toFixed(1)),
    }));

    return sendSuccess(res, { average: parseFloat(overallAverage.toFixed(1)), breakdown });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reports/completion-rates
router.get('/completion-rates', requirePermission('analytics:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { startDate, endDate } = req.query as Record<string, string>;

    const start = parseDate(startDate) || subDays(new Date(), 30);
    const end = parseDate(endDate) || new Date();

    const orders = await prisma.order.findMany({
      where: {
        clientId: user.clientId,
        createdAt: { gte: start, lte: end },
      },
      select: { status: true },
    });

    const total = orders.length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const pending = orders.filter(o => ['draft', 'submitted', 'awaiting_applicant', 'data_verification', 'in_progress', 'pending_review'].includes(o.status)).length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const requiresAction = orders.filter(o => o.status === 'requires_action').length;

    const completionRate = total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0;

    return sendSuccess(res, {
      total,
      completed,
      pending,
      cancelled,
      requiresAction,
      completionRate,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reports/service-breakdown
router.get('/service-breakdown', requirePermission('analytics:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { startDate, endDate } = req.query as Record<string, string>;

    const start = parseDate(startDate) || subDays(new Date(), 30);
    const end = parseDate(endDate) || new Date();

    // Get orders with packages
    const orders = await prisma.order.findMany({
      where: {
        clientId: user.clientId,
        createdAt: { gte: start, lte: end },
        packageId: { not: null },
      },
      include: {
        package: {
          include: {
            // Get services from the package
          },
        },
      },
    });

    // Count service occurrences
    const serviceCounts: Record<string, number> = {};
    let totalServices = 0;

    orders.forEach(order => {
      if (order.package && order.package.services) {
        const serviceIds = order.package.services as string[];
        serviceIds.forEach(id => {
          serviceCounts[id] = (serviceCounts[id] || 0) + 1;
          totalServices++;
        });
      }
    });

    // Get service details
    const serviceIds = Object.keys(serviceCounts);
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });

    const serviceMap = new Map(services.map(s => [s.id, s.name]));

    const breakdown = serviceIds.map(id => ({
      serviceName: serviceMap.get(id) || `Service ${id.slice(0, 8)}`,
      count: serviceCounts[id],
      percentage: parseFloat(((serviceCounts[id] / totalServices) * 100).toFixed(1)),
    })).sort((a, b) => b.count - a.count);

    return sendSuccess(res, breakdown);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reports/export
router.get('/export', requirePermission('analytics:read') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { type = 'order-volume', format: exportFormat = 'csv', startDate, endDate } = req.query as Record<string, string>;

    if (exportFormat === 'pdf') {
      return sendError(res, 501, 'NOT_IMPLEMENTED', 'PDF export coming soon');
    }

    const start = parseDate(startDate) || subDays(new Date(), 30);
    const end = parseDate(endDate) || new Date();

    let csvContent = '';

    if (type === 'order-volume') {
      // Get orders
      const orders = await prisma.order.findMany({
        where: {
          clientId: user.clientId,
          createdAt: { gte: start, lte: end },
        },
        select: { orderNumber: true, status: true, createdAt: true, positionTitle: true },
        orderBy: { createdAt: 'desc' },
      });

      csvContent = 'Order Number,Status,Created Date,Position Title\n';
      orders.forEach(o => {
        csvContent += `${o.orderNumber},${o.status},${format(o.createdAt, 'yyyy-MM-dd HH:mm')},${o.positionTitle || ''}\n`;
      });
    } else if (type === 'turnaround') {
      const orders = await prisma.order.findMany({
        where: {
          clientId: user.clientId,
          status: 'completed',
          submittedAt: { not: null },
          completedAt: { not: null },
        },
        select: {
          orderNumber: true,
          submittedAt: true,
          completedAt: true,
          package: { select: { name: true } },
        },
      });

      csvContent = 'Order Number,Package,Submitted Date,Completed Date,Turnaround Days\n';
      orders.forEach(o => {
        const days = o.completedAt && o.submittedAt 
          ? (o.completedAt.getTime() - o.submittedAt.getTime()) / (1000 * 60 * 60 * 24)
          : 0;
        csvContent += `${o.orderNumber},${o.package?.name || 'Custom'},${o.submittedAt ? format(o.submittedAt, 'yyyy-MM-dd') : ''},${o.completedAt ? format(o.completedAt, 'yyyy-MM-dd') : ''},${days.toFixed(1)}\n`;
      });
    } else if (type === 'completion') {
      const orders = await prisma.order.findMany({
        where: {
          clientId: user.clientId,
          createdAt: { gte: start, lte: end },
        },
        select: { orderNumber: true, status: true, createdAt: true },
      });

      csvContent = 'Order Number,Status,Created Date\n';
      orders.forEach(o => {
        csvContent += `${o.orderNumber},${o.status},${format(o.createdAt, 'yyyy-MM-dd HH:mm')}\n`;
      });
    } else if (type === 'service-breakdown') {
      csvContent = 'Service Name,Count,Percentage\n';
      // Simplified - would need same logic as service-breakdown endpoint
      csvContent += 'Note: Service breakdown export requires additional processing\n';
    } else {
      return sendError(res, 400, 'INVALID_TYPE', 'Invalid report type');
    }

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${format(new Date(), 'yyyy-MM-dd')}.csv"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

export default router;
