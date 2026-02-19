// @ts-nocheck
import { Router, Request, Response } from 'express';
import passport from 'passport';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { authenticate, requirePermission } from '../middleware/auth';
import { sendError, sendSuccess, ErrorCodes, HttpStatus } from '../utils/response';

const router = Router();

// Order status flow
const STATUS_FLOW: Record<string, string[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['pending_review', 'in_progress', 'cancelled'],
  pending_review: ['completed', 'in_progress', 'requires_action'],
  requires_action: ['pending_review', 'in_progress', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * @route   GET /api/orders
 * @desc    Get all orders with filtering, sorting, pagination
 * @access  Private
 */
router.get('/', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminReq = req as AuthenticatedRequest;
    const role = adminReq.adminUser?.role;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    // Get orders using raw query
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ` AND status = ?`;
      params.push(status);
    }
    
    if (search) {
      whereClause += ` AND (candidate_first_name LIKE ? OR candidate_last_name LIKE ? OR candidate_email LIKE ? OR order_number LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    const countQuery = `SELECT COUNT(*) as count FROM orders ${whereClause}`;
    const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
    const total = Number((countResult as any[])[0]?.count || 0);

    const ordersQuery = `
      SELECT 
        o.id, o.order_number, o.client_id, o.candidate_first_name, o.candidate_last_name,
        o.candidate_email, o.status, o.priority, o.sla_due_date, o.created_at, o.updated_at,
        c.company_name as client_name
      FROM orders o
      LEFT JOIN clients c ON o.client_id = c.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const orders = await prisma.$queryRawUnsafe(ordersQuery, ...params, limit, skip);

    sendSuccess(res, {
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    sendError(res, 'Failed to fetch orders', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order with full details
 * @access  Private
 */
router.get('/:id', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.$queryRawUnsafe(`
      SELECT o.*, c.company_name as client_name
      FROM orders o LEFT JOIN clients c ON o.client_id = c.id
      WHERE o.id = ?
    `, id);

    if (!order || (order as any[]).length === 0) {
      sendError(res, 'Order not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
      return;
    }

    const assignments = await prisma.orderAssignment.findMany({
      where: { orderId: id },
      include: { admin: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
    });

    sendSuccess(res, { order: (order as any[])[0], assignments, statusFlow: STATUS_FLOW });
  } catch (error) {
    console.error('Get order error:', error);
    sendError(res, 'Failed to fetch order', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private
 */
router.put('/:id/status', authenticate(passport), requirePermission('orders', 'update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { status, notes } = req.body;

    await prisma.$executeRawUnsafe(`UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?`, status, id);

    await prisma.adminAuditLog.create({
      data: {
        adminId: adminReq.adminUser!.id,
        action: 'update',
        resourceType: 'order',
        resourceId: id,
      },
    });

    sendSuccess(res, { message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    sendError(res, 'Failed to update status', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   PUT /api/orders/:id/assign
 * @desc    Assign order to admin user(s)
 * @access  Private
 */
router.put('/:id/assign', authenticate(passport), requirePermission('orders', 'update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { adminIds, assignmentType = 'processing' } = req.body;

    await prisma.orderAssignment.updateMany({
      where: { orderId: id, status: 'active' },
      data: { status: 'completed', completedAt: new Date() },
    });

    const assignments = await Promise.all(
      adminIds.map((adminId: string) =>
        prisma.orderAssignment.create({
          data: {
            orderId: id,
            adminId,
            assignedBy: adminReq.adminUser!.id,
            assignmentType,
            status: 'active',
          },
        })
      )
    );

    sendSuccess(res, { message: 'Order assigned successfully', assignments });
  } catch (error) {
    console.error('Assign order error:', error);
    sendError(res, 'Failed to assign order', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

export default router;