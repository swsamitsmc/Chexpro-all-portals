// @ts-nocheck
import { Router, Request, Response } from 'express';
import passport from 'passport';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { authenticate, requirePermission } from '../middleware/auth';
import { sendError, sendSuccess, ErrorCodes, HttpStatus } from '../utils/response';

const router = Router();

/**
 * @route   GET /api/vendors
 * @desc    Get all vendors
 * @access  Private
 */
router.get('/', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        services: true,
        _count: { select: { routingRules: true } },
      },
      orderBy: { name: 'asc' },
    });

    sendSuccess(res, { vendors });
  } catch (error) {
    console.error('Get vendors error:', error);
    sendError(res, 'Failed to fetch vendors', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   GET /api/vendors/:id
 * @desc    Get single vendor
 * @access  Private
 */
router.get('/:id', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        services: true,
        pricing: true,
        performance: { orderBy: { date: 'desc' }, take: 30 },
        routingRules: true,
        issues: { where: { status: { in: ['open', 'in_progress'] } }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!vendor) {
      sendError(res, 'Vendor not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
      return;
    }

    sendSuccess(res, { vendor });
  } catch (error) {
    console.error('Get vendor error:', error);
    sendError(res, 'Failed to fetch vendor', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   PUT /api/vendors/:id/status
 * @desc    Update vendor status
 * @access  Private
 */
router.put('/:id/status', authenticate(passport), requirePermission('vendors', 'update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { status } = req.body;

    const vendor = await prisma.vendor.update({
      where: { id },
      data: { status },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: adminReq.adminUser!.id,
        action: 'update',
        resourceType: 'vendor',
        resourceId: id,
      },
    });

    sendSuccess(res, { vendor });
  } catch (error) {
    console.error('Update vendor status error:', error);
    sendError(res, 'Failed to update vendor status', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

export default router;