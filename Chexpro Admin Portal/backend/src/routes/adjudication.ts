// @ts-nocheck
import { Router, Request, Response } from 'express';
import passport from 'passport';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { authenticate, requirePermission } from '../middleware/auth';
import { sendError, sendSuccess, ErrorCodes, HttpStatus } from '../utils/response';

const router = Router();

/**
 * @route   GET /api/adjudication/queue
 * @desc    Get adjudication queue
 * @access  Private
 */
router.get('/queue', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await prisma.adjudicationReview.findMany({
      where: { finalDecision: null },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, { reviews });
  } catch (error) {
    console.error('Get adjudication queue error:', error);
    sendError(res, 'Failed to fetch adjudication queue', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   GET /api/adjudication/:id
 * @desc    Get single adjudication review
 * @access  Private
 */
router.get('/:id', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await prisma.adjudicationReview.findUnique({
      where: { id },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!review) {
      sendError(res, 'Adjudication review not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
      return;
    }

    sendSuccess(res, { review });
  } catch (error) {
    console.error('Get adjudication review error:', error);
    sendError(res, 'Failed to fetch adjudication review', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   PUT /api/adjudication/:id
 * @desc    Update adjudication review
 * @access  Private
 */
router.put('/:id', authenticate(passport), requirePermission('adjudication', 'update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { manualOverride, manualDecision, decisionReasoning, mitigatingFactors, aggravatingFactors, finalDecision, notes } = req.body;

    const review = await prisma.adjudicationReview.update({
      where: { id },
      data: {
        manualOverride,
        manualDecision,
        decisionReasoning,
        mitigatingFactors,
        aggravatingFactors,
        finalDecision,
        notes,
        decidedAt: finalDecision ? new Date() : null,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: adminReq.adminUser!.id,
        action: 'update',
        resourceType: 'adjudication_review',
        resourceId: id,
      },
    });

    sendSuccess(res, { review });
  } catch (error) {
    console.error('Update adjudication review error:', error);
    sendError(res, 'Failed to update adjudication review', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

export default router;