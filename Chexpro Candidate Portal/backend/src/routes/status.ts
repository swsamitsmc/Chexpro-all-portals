import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  awaiting_applicant_info: 'Waiting for information',
  data_verification: 'Verifying information',
  in_progress: 'Processing',
  pending_review: 'Under review',
  requires_action: 'Action needed',
  completed: 'Complete',
  cancelled: 'Cancelled',
};

// GET /api/v1/status/check/:orderNumber
router.get('/check/:orderNumber', async (req, res: Response) => {
  try {
    const { orderNumber } = req.params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
    }

    res.json(successResponse({
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: statusLabels[order.status] || order.status,
      lastUpdated: order.updatedAt,
      estimatedCompletionDate: order.dueDate,
    }));
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get status'));
  }
});

export default router;
