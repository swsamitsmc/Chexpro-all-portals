// @ts-nocheck
import { Router, Request, Response } from 'express';
import passport from 'passport';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { authenticate, requirePermission } from '../middleware/auth';
import { sendError, sendSuccess, ErrorCodes, HttpStatus } from '../utils/response';

const router = Router();

/**
 * @route   GET /api/clients
 * @desc    Get all clients with pagination
 * @access  Private
 */
router.get('/', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ` AND (company_name LIKE ? OR contact_email LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    const countQuery = `SELECT COUNT(*) as count FROM clients ${whereClause}`;
    const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
    const total = Number((countResult as any[])[0]?.count || 0);

    const clientsQuery = `
      SELECT id, company_name, contact_email, contact_phone, status, created_at
      FROM clients ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const clients = await prisma.$queryRawUnsafe(clientsQuery, ...params, limit, skip);

    sendSuccess(res, {
      clients,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get clients error:', error);
    sendError(res, 'Failed to fetch clients', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   GET /api/clients/:id
 * @desc    Get single client details
 * @access  Private
 */
router.get('/:id', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const client = await prisma.$queryRawUnsafe(`
      SELECT * FROM clients WHERE id = ?
    `, id);

    if (!client || (client as any[]).length === 0) {
      sendError(res, 'Client not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
      return;
    }

    const credentialing = await prisma.credentialingWorkflow.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, { client: (client as any[])[0], credentialing });
  } catch (error) {
    console.error('Get client error:', error);
    sendError(res, 'Failed to fetch client', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   POST /api/clients
 * @desc    Create new client
 * @access  Private
 */
router.post('/', authenticate(passport), requirePermission('clients', 'create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyName, contactEmail, contactPhone, address, settings } = req.body;
    const adminReq = req as AuthenticatedRequest;

    const result = await prisma.$executeRawUnsafe(`
      INSERT INTO clients (id, company_name, contact_email, contact_phone, address, settings, status, created_at, updated_at)
      VALUES (UUID(), ?, ?, ?, ?, ?, 'active', NOW(), NOW())
    `, companyName, contactEmail, contactPhone, JSON.stringify(address || {}), JSON.stringify(settings || {}));

    await prisma.adminAuditLog.create({
      data: {
        adminId: adminReq.adminUser!.id,
        action: 'create',
        resourceType: 'client',
      },
    });

    sendSuccess(res, { message: 'Client created successfully' }, HttpStatus.CREATED);
  } catch (error) {
    console.error('Create client error:', error);
    sendError(res, 'Failed to create client', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   PUT /api/clients/:id/credentialing/:stepId
 * @desc    Update credentialing step
 * @access  Private
 */
router.put('/:id/credentialing/:stepId', authenticate(passport), requirePermission('clients', 'update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, stepId } = req.params;
    const { status, notes } = req.body;
    const adminReq = req as AuthenticatedRequest;

    const step = await prisma.credentialingStep.findFirst({
      where: { id: stepId, workflow: { clientId: id } },
    });

    if (!step) {
      sendError(res, 'Credentialing step not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
      return;
    }

    const updatedStep = await prisma.credentialingStep.update({
      where: { id: stepId },
      data: {
        status,
        notes,
        completedAt: status === 'completed' ? new Date() : null,
        completedBy: status === 'completed' ? adminReq.adminUser!.id : null,
      },
    });

    sendSuccess(res, { step: updatedStep });
  } catch (error) {
    console.error('Update credentialing step error:', error);
    sendError(res, 'Failed to update credentialing step', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

export default router;