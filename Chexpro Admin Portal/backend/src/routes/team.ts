// @ts-nocheck
import { Router, Request, Response } from 'express';
import passport from 'passport';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { authenticate, requirePermission } from '../middleware/auth';
import { sendError, sendSuccess, ErrorCodes, HttpStatus } from '../utils/response';

const router = Router();

/**
 * @route   GET /api/team
 * @desc    Get all team members
 * @access  Private
 */
router.get('/', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const members = await prisma.adminUser.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        status: true,
        createdAt: true,
      },
      orderBy: { firstName: 'asc' },
    });

    const teams = await prisma.team.findMany({
      include: {
        lead: { select: { id: true, firstName: true, lastName: true } },
        members: { include: { admin: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });

    sendSuccess(res, { members, teams });
  } catch (error) {
    console.error('Get team error:', error);
    sendError(res, 'Failed to fetch team', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   PUT /api/team/:id/status
 * @desc    Update team member status
 * @access  Private
 */
router.put('/:id/status', authenticate(passport), requirePermission('team', 'update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { status } = req.body;

    const member = await prisma.adminUser.update({
      where: { id },
      data: { status },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: adminReq.adminUser!.id,
        action: 'update',
        resourceType: 'admin_user',
        resourceId: id,
      },
    });

    sendSuccess(res, { member });
  } catch (error) {
    console.error('Update team member status error:', error);
    sendError(res, 'Failed to update team member status', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

export default router;