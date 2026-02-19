import { Router, Request, Response } from 'express';
import passport from 'passport';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { authenticate } from '../middleware/auth';
import { sendError, sendSuccess, ErrorCodes, HttpStatus } from '../utils/response';

const router = Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/stats', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminReq = req as AuthenticatedRequest;
    const adminId = adminReq.adminUser?.id;
    const role = adminReq.adminUser?.role;

    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total orders (from client portal schema - we'll query the shared database)
    const totalOrders = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM orders WHERE created_at >= ${thirtyDaysAgo}
    `;

    // Pending review orders
    const pendingReview = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM orders 
      WHERE status IN ('pending_review', 'requires_action')
    `;

    // Completed today
    const completedToday = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM orders 
      WHERE status = 'completed' AND completed_at >= ${today}
    `;

    // SLA breaches (from SLA alerts table)
    const slaBreaches = await prisma.sLAAlert.count({
      where: {
        severity: 'critical',
        acknowledged: false,
      },
    });

    // Orders assigned to current user (if processor)
    let myAssignments = 0;
    if (role === 'processor' || role === 'qa_specialist') {
      myAssignments = await prisma.orderAssignment.count({
        where: {
          adminId: adminId!,
          status: 'active',
        },
      });
    }

    const stats = {
      totalOrders: Number(totalOrders[0]?.count || 0),
      pendingReview: Number(pendingReview[0]?.count || 0),
      completedToday: Number(completedToday[0]?.count || 0),
      slaBreaches,
      myAssignments,
    };

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    sendError(res, 'Failed to fetch dashboard statistics', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   GET /api/dashboard/orders-overview
 * @desc    Get orders by status for chart
 * @access  Private
 */
router.get('/orders-overview', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const ordersByStatus = await prisma.$queryRaw<{ status: string; count: bigint }[]>`
      SELECT status, COUNT(*) as count 
      FROM orders 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY status
    `;

    const overview = ordersByStatus.map((item) => ({
      status: item.status,
      count: Number(item.count),
    }));

    sendSuccess(res, overview);
  } catch (error) {
    console.error('Orders overview error:', error);
    sendError(res, 'Failed to fetch orders overview', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   GET /api/dashboard/sla-status
 * @desc    Get SLA status breakdown
 * @access  Private
 */
router.get('/sla-status', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await prisma.sLAAlert.findMany({
      where: { acknowledged: false },
      select: {
        id: true,
        alertType: true,
        severity: true,
        message: true,
        hoursRemaining: true,
        createdAt: true,
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: 10,
    });

    const summary = {
      critical: await prisma.sLAAlert.count({ where: { severity: 'critical', acknowledged: false } }),
      high: await prisma.sLAAlert.count({ where: { severity: 'high', acknowledged: false } }),
      medium: await prisma.sLAAlert.count({ where: { severity: 'medium', acknowledged: false } }),
      low: await prisma.sLAAlert.count({ where: { severity: 'low', acknowledged: false } }),
    };

    sendSuccess(res, { summary, alerts });
  } catch (error) {
    console.error('SLA status error:', error);
    sendError(res, 'Failed to fetch SLA status', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   GET /api/dashboard/my-workload
 * @desc    Get assigned workload for current user
 * @access  Private
 */
router.get('/my-workload', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminReq = req as AuthenticatedRequest;
    const adminId = adminReq.adminUser?.id;

    const assignments = await prisma.orderAssignment.findMany({
      where: {
        adminId: adminId!,
        status: 'active',
      },
      select: {
        id: true,
        orderId: true,
        assignmentType: true,
        priority: true,
        assignedAt: true,
        notes: true,
      },
      orderBy: [{ priority: 'desc' }, { assignedAt: 'asc' }],
      take: 20,
    });

    sendSuccess(res, assignments);
  } catch (error) {
    console.error('Workload error:', error);
    sendError(res, 'Failed to fetch workload', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   GET /api/dashboard/qa-metrics
 * @desc    Get QA metrics for QA specialists
 * @access  Private
 */
router.get('/qa-metrics', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingReviews = await prisma.qAReview.count({
      where: { status: 'pending' },
    });

    const inProgress = await prisma.qAReview.count({
      where: { status: 'in_review' },
    });

    const completedToday = await prisma.qAReview.count({
      where: {
        status: 'approved',
        reviewCompletedAt: { gte: today },
      },
    });

    const failedToday = await prisma.qAReview.count({
      where: {
        status: 'failed',
        reviewCompletedAt: { gte: today },
      },
    });

    // Calculate pass rate for last 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const totalCompleted7Days = await prisma.qAReview.count({
      where: {
        status: { in: ['approved', 'failed'] },
        reviewCompletedAt: { gte: sevenDaysAgo },
      },
    });

    const passed7Days = await prisma.qAReview.count({
      where: {
        status: 'approved',
        reviewCompletedAt: { gte: sevenDaysAgo },
      },
    });

    const passRate = totalCompleted7Days > 0 ? Math.round((passed7Days / totalCompleted7Days) * 100) : 0;

    sendSuccess(res, {
      pendingReviews,
      inProgress,
      completedToday,
      failedToday,
      passRate,
    });
  } catch (error) {
    console.error('QA metrics error:', error);
    sendError(res, 'Failed to fetch QA metrics', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   GET /api/dashboard/recent-activity
 * @desc    Get recent activity feed
 * @access  Private
 */
router.get('/recent-activity', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const auditLogs = await prisma.adminAuditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        createdAt: true,
        adminId: true,
      },
    });

    sendSuccess(res, auditLogs);
  } catch (error) {
    console.error('Recent activity error:', error);
    sendError(res, 'Failed to fetch recent activity', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   GET /api/dashboard/vendor-performance
 * @desc    Get vendor performance metrics
 * @access  Private
 */
router.get('/vendor-performance', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const performance = await prisma.vendorPerformance.findMany({
      where: {
        date: { gte: sevenDaysAgo },
      },
      select: {
        vendorId: true,
        date: true,
        ordersCompleted: true,
        avgTatHours: true,
        onTimeRate: true,
        errorRate: true,
        qualityScore: true,
      },
      orderBy: { date: 'desc' },
    });

    // Get vendor names
    const vendorIds = [...new Set(performance.map((p) => p.vendorId))];
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, name: true, displayName: true },
    });

    const vendorMap = new Map(vendors.map((v) => [v.id, v]));

    const result = performance.map((p) => ({
      ...p,
      vendor: vendorMap.get(p.vendorId),
    }));

    sendSuccess(res, result);
  } catch (error) {
    console.error('Vendor performance error:', error);
    sendError(res, 'Failed to fetch vendor performance', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

export default router;