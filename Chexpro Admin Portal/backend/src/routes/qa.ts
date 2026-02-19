// @ts-nocheck
import { Router, Request, Response } from 'express';
import passport from 'passport';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { authenticate, requirePermission } from '../middleware/auth';
import { sendError, sendSuccess, ErrorCodes, HttpStatus } from '../utils/response';

const router = Router();

/**
 * @route   GET /api/qa/queue
 * @desc    Get QA review queue
 * @access  Private
 */
router.get('/queue', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || 'pending';

    const reviews = await prisma.qAReview.findMany({
      where: { status },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, { reviews });
  } catch (error) {
    console.error('Get QA queue error:', error);
    sendError(res, 'Failed to fetch QA queue', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   GET /api/qa/:id
 * @desc    Get single QA review
 * @access  Private
 */
router.get('/:id', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await prisma.qAReview.findUnique({
      where: { id },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!review) {
      sendError(res, 'QA review not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
      return;
    }

    sendSuccess(res, { review });
  } catch (error) {
    console.error('Get QA review error:', error);
    sendError(res, 'Failed to fetch QA review', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   PUT /api/qa/:id
 * @desc    Update QA review (approve/reject)
 * @access  Private
 */
router.put('/:id', authenticate(passport), requirePermission('qa', 'update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { decision, notes, failureReasons, correctionsNeeded } = req.body;

    const review = await prisma.qAReview.update({
      where: { id },
      data: {
        status: decision === 'approve' ? 'approved' : 'failed',
        decision,
        notes,
        failureReasons,
        correctionsNeeded,
        reviewCompletedAt: new Date(),
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: adminReq.adminUser!.id,
        action: 'update',
        resourceType: 'qa_review',
        resourceId: id,
      },
    });

    sendSuccess(res, { review });
  } catch (error) {
    console.error('Update QA review error:', error);
    sendError(res, 'Failed to update QA review', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

export default router;