import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { parsePagination, generateOrderNumber } from '../utils/helpers';
import { sendEmail, invitationEmailTemplate, orderCompletedEmailTemplate } from '../utils/email';
import { env } from '../config/env';
import { generateToken } from '../utils/helpers';
import { encryptField } from '../utils/encryption';
import fs from 'fs';
import readline from 'readline';
import { AuthenticatedRequest } from '../types';
import { Prisma } from '@prisma/client';

const router = Router();
router.use(authenticate);

// GET /api/v1/orders
router.get('/', requirePermission('orders:read'), async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const { status, search, startDate, endDate } = req.query as Record<string, string>;
  const user = req.user!;

  const where: any = { clientId: user.clientId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { applicant: { OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }, { email: { contains: search } }] } },
      { positionTitle: { contains: search } },
      { referenceNumber: { contains: search } },
    ];
  }
  if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip, take: limit, orderBy: { updatedAt: 'desc' },
      include: { applicant: { select: { firstName: true, lastName: true, email: true } }, package: { select: { name: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  return sendPaginated(res, orders, total, page, limit);
});

// POST /api/v1/orders
router.post('/', requirePermission('orders:create'), async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { packageId, referenceNumber, positionTitle, department, screeningReason, jobLocation, isDraft } = req.body;

  const count = await prisma.order.count({ where: { clientId: user.clientId } });
  const orderNumber = generateOrderNumber(count + 1);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      clientId: user.clientId,
      createdBy: user.id,
      packageId: packageId || null,
      referenceNumber: referenceNumber || null,
      positionTitle: positionTitle || null,
      department: department || null,
      screeningReason: screeningReason || null,
      jobLocation: jobLocation || null,
      status: isDraft ? 'draft' : 'draft',
    } as any,
    include: { package: { select: { name: true } } },
  });

  return sendSuccess(res, order, 201);
});

// GET /api/v1/orders/:id
router.get('/:id', requirePermission('orders:read'), async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, clientId: user.clientId },
    include: {
      applicant: true,
      package: true,
      vendorOrders: true,
      documents: true,
      timeline: { orderBy: { createdAt: 'asc' } },
      reports: true,
      adjudication: true,
    },
  });

  if (!order) return sendError(res, 404, 'NOT_FOUND', 'Order not found');
  return sendSuccess(res, order);
});

// PATCH /api/v1/orders/:id
router.patch('/:id', requirePermission('orders:update') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const existing = await prisma.order.findFirst({ where: { id: req.params.id, clientId: user.clientId } });
    if (!existing) return sendError(res, 404, 'NOT_FOUND', 'Order not found');
    if (!['draft', 'requires_action'].includes(existing.status)) {
      return sendError(res, 400, 'INVALID_STATUS', 'Order cannot be updated in current status');
    }

    const { referenceNumber, positionTitle, department, screeningReason, jobLocation, packageId } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { referenceNumber, positionTitle, department, screeningReason, jobLocation, packageId },
    });

    // WebSocket emission
    const io = (req.app as any).get('io');
    if (io) {
      io.to(`order:${order.id}`).emit('orderStatusChanged', { orderId: order.id, status: order.status, updatedAt: new Date() });
      io.to(`client:${order.clientId}`).emit('orderUpdated', { orderId: order.id, status: order.status });
    }

    return sendSuccess(res, order);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/orders/:id/submit
router.post('/:id/submit', requirePermission('orders:create'), async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, clientId: user.clientId, status: 'draft' },
    include: { applicant: true },
  });

  if (!order) return sendError(res, 404, 'NOT_FOUND', 'Draft order not found');
  if (!order.applicantId) return sendError(res, 400, 'MISSING_APPLICANT', 'Applicant information required before submission');

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'submitted', submittedAt: new Date() },
  });

  await prisma.orderTimeline.create({
    data: {
      orderId: order.id,
      status: 'submitted',
      message: 'Order submitted for processing',
      createdById: user.id,
    } as any,
  });

  // Send invitation email if applicant has email
  if (order.applicant?.email) {
    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + env.security.invitationTokenExpiresDays * 24 * 60 * 60 * 1000);

    await prisma.applicant.update({
      where: { id: order.applicantId! },
      data: { invitationToken: token, tokenExpiresAt: expiresAt },
    });

    const client = await prisma.client.findUnique({ where: { id: user.clientId }, select: { companyName: true } });
    const template = invitationEmailTemplate({
      applicantName: `${order.applicant.firstName} ${order.applicant.lastName}`,
      clientName: client?.companyName ?? 'ChexPro',
      portalLink: `${env.frontendUrl}/applicant?token=${token}`,
      expiresInDays: env.security.invitationTokenExpiresDays,
    });
    await sendEmail({ to: order.applicant.email, ...template });
  }

  return sendSuccess(res, updated);
});

// POST /api/v1/orders/:id/cancel
router.post('/:id/cancel', requirePermission('orders:cancel'), async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { reason } = req.body;
  const order = await prisma.order.findFirst({ where: { id: req.params.id, clientId: user.clientId } });
  if (!order) return sendError(res, 404, 'NOT_FOUND', 'Order not found');
  if (['cancelled', 'completed'].includes(order.status)) {
    return sendError(res, 400, 'INVALID_STATUS', 'Cannot cancel a completed or already cancelled order');
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'cancelled' },
  });

  await prisma.orderTimeline.create({
    data: { orderId: order.id, status: 'cancelled', message: reason || 'Order cancelled', createdById: user.id } as any,
  });

  return sendSuccess(res, updated);
});

// GET /api/v1/orders/:id/timeline
router.get('/:id/timeline', requirePermission('orders:read'), async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const order = await prisma.order.findFirst({ where: { id: req.params.id, clientId: user.clientId } });
  if (!order) return sendError(res, 404, 'NOT_FOUND', 'Order not found');

  const timeline = await prisma.orderTimeline.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: 'asc' },
  });
  return sendSuccess(res, timeline);
});

// POST /api/v1/orders/bulk-upload
router.post('/bulk-upload', requirePermission('orders:create') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    
    // Multer handles file upload
    const uploadSingle = (await import('../middleware/upload')).uploadSingle;
    uploadSingle(req, res, async (err: any) => {
      if (err) {
        return sendError(res, 400, 'UPLOAD_ERROR', err.message || 'File upload failed');
      }

      const file = req.file;
      if (!file) {
        return sendError(res, 400, 'NO_FILE', 'No file uploaded');
      }

      // Parse CSV
      const fileStream = fs.createReadStream(file.path);
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
      
      const errors: string[] = [];
      let header: string[] = [];
      let created = 0;
      let rowNum = 1;

      for await (const line of rl) {
        rowNum++;
        if (rowNum === 2) {
          header = line.split(',').map(h => h.trim().replace(/"/g, ''));
          continue;
        }
        
        if (!line.trim()) continue;
        
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, string> = {};
        header.forEach((h, i) => { row[h] = values[i] || ''; });

        // Validate required fields
        if (!row.positionTitle) {
          errors.push(`Row ${rowNum}: Missing required field 'positionTitle'`);
          continue;
        }

        try {
          // Generate order number
          const count = await prisma.order.count({ where: { clientId: user.clientId } });
          const orderNumber = generateOrderNumber(count + 1);

          // Find package by name if provided
          let packageId = null;
          if (row.packageName) {
            const pkg = await prisma.package.findFirst({ 
              where: { name: row.packageName, OR: [{ clientId: user.clientId }, { clientId: null }] } 
            });
            packageId = pkg?.id || null;
          }

          // Create order
          const order = await prisma.order.create({
            data: {
              orderNumber,
              clientId: user.clientId,
              createdBy: { connect: { id: user.id } },
              packageId,
              referenceNumber: row.referenceNumber || null,
              positionTitle: row.positionTitle,
              department: row.department || null,
              screeningReason: row.screeningReason || 'Employment',
              status: 'draft',
            } as any,
          });

          // Create applicant if email provided
          if (row.applicantEmail || (row.applicantFirstName && row.applicantLastName)) {
            const applicant = await prisma.applicant.create({
              data: {
                firstName: row.applicantFirstName || '',
                lastName: row.applicantLastName || '',
                email: row.applicantEmail || null,
                phone: row.applicantPhone || null,
              },
            });

            await prisma.order.update({
              where: { id: order.id },
              data: { applicantId: applicant.id },
            });

            // Send invitation if email provided
            if (row.applicantEmail) {
              const token = generateToken(32);
              const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
              
              await prisma.applicant.update({
                where: { id: applicant.id },
                data: { invitationToken: token, tokenExpiresAt: expiresAt },
              });

              const client = await prisma.client.findUnique({ where: { id: user.clientId } });
              const portalLink = `${env.frontendUrl}/applicant-portal/${token}`;
              
              try {
                await sendEmail({
                  to: row.applicantEmail,
                  subject: `Complete Your Background Check for ${client?.companyName}`,
                  html: `<p>Please complete your background check: <a href="${portalLink}">Click here</a></p>`,
                  text: `Please complete your background check: ${portalLink}`,
                });
              } catch (emailErr) {
                console.error('Email send failed:', emailErr);
              }
            }
          }

          created++;
        } catch (rowErr: any) {
          errors.push(`Row ${rowNum}: ${rowErr.message}`);
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(file.path);

      return sendSuccess(res, { created, failed: errors.length, errors: errors.slice(0, 10) });
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/orders/:id/rescreen
router.post('/:id/rescreen', requirePermission('orders:create') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Verify order exists, belongs to client, and is completed
    const originalOrder = await prisma.order.findFirst({
      where: { id, clientId: user.clientId, status: 'completed' },
      include: { applicant: true, package: true },
    });

    if (!originalOrder) {
      return sendError(res, 404, 'NOT_FOUND', 'Completed order not found');
    }

    // Generate new order number
    const count = await prisma.order.count({ where: { clientId: user.clientId } });
    const orderNumber = generateOrderNumber(count + 1);

    // Create new applicant (copy from original)
    let newApplicantId = originalOrder.applicantId;
    if (originalOrder.applicant) {
      const newApplicant = await prisma.applicant.create({
        data: {
          firstName: originalOrder.applicant.firstName,
          lastName: originalOrder.applicant.lastName,
          email: originalOrder.applicant.email,
          phone: originalOrder.applicant.phone,
          dateOfBirth: originalOrder.applicant.dateOfBirth,
          sinEncrypted: originalOrder.applicant.sinEncrypted,
          currentAddress: originalOrder.applicant.currentAddress as Prisma.InputJsonValue | undefined,
          addressHistory: originalOrder.applicant.addressHistory as Prisma.InputJsonValue | undefined,
          employmentHistory: originalOrder.applicant.employmentHistory as Prisma.InputJsonValue | undefined,
          educationHistory: originalOrder.applicant.educationHistory as Prisma.InputJsonValue | undefined,
          consentGiven: false,
          consentDate: null,
          portalCompleted: false,
          portalStep: 0,
        },
      });
      newApplicantId = newApplicant.id;
    }

    // Create new order
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        clientId: user.clientId,
        createdBy: { connect: { id: user.id } },
        packageId: originalOrder.packageId,
        customServices: originalOrder.customServices as Prisma.InputJsonValue | undefined,
        referenceNumber: originalOrder.referenceNumber,
        positionTitle: originalOrder.positionTitle,
        department: originalOrder.department,
        screeningReason: originalOrder.screeningReason,
        jobLocation: originalOrder.jobLocation,
        applicantId: newApplicantId,
        status: 'submitted',
        submittedAt: new Date(),
      } as any,
    });

    // Add timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: newOrder.id,
        status: 'rescreen_initiated',
        description: `Re-screen initiated from order ${originalOrder.orderNumber}`,
        createdBy: user.email,
      },
    });

    return sendSuccess(res, { newOrderId: newOrder.id, newOrderNumber: newOrder.orderNumber });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/:id/report
router.get('/:id/report', requirePermission('reports:download') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, clientId: user.clientId },
    });

    if (!order) {
      return sendError(res, 404, 'NOT_FOUND', 'Order not found');
    }

    const report = await prisma.report.findFirst({
      where: { orderId: id },
    });

    if (!report) {
      return sendError(res, 404, 'REPORT_NOT_READY', 'Report not yet available');
    }

    return sendSuccess(res, {
      reportId: report.id,
      generatedAt: report.generatedAt,
      filePath: report.filePath,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/orders/export
router.get('/export', requirePermission('orders:export') as any, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { format = 'csv', status, startDate, endDate } = req.query as Record<string, string>;

    const where: any = { clientId: user.clientId };
    if (status) where.status = status;
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        applicant: { select: { firstName: true, lastName: true, email: true } },
        package: { select: { name: true } },
      },
    });

    // Build CSV
    let csv = 'OrderNumber,Status,ApplicantName,PackageName,PositionTitle,Department,SubmittedAt,CompletedAt,TotalPrice\n';
    
    orders.forEach(o => {
      const applicantName = o.applicant ? `${o.applicant.firstName} ${o.applicant.lastName}` : '';
      csv += `${o.orderNumber},${o.status},"${applicantName}","${o.package?.name || 'Custom'}","${o.positionTitle || ''}","${o.department || ''}",${o.submittedAt ? new Date(o.submittedAt).toISOString() : ''},${o.completedAt ? new Date(o.completedAt).toISOString() : ''},${o.totalPrice}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

export default router;
