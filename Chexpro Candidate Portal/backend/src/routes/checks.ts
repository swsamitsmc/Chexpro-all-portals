import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { authenticateJWT } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// GET /api/v1/checks
router.get('/', authenticateJWT, async (req, res: Response) => {
  try {
    const applicants = await prisma.applicant.findMany({
      where: { userId: req.user!.id },
      include: {
        order: {
          include: { client: true },
        },
      },
    });

    const checks = await Promise.all(
      applicants.map(async (applicant) => {
        const order = applicant.order;
        if (!order) return null;

        const timeline = await prisma.orderTimeline.findFirst({
          where: { orderId: order.id },
          orderBy: { createdAt: 'desc' },
        });

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          positionTitle: order.positionTitle,
          companyName: order.client?.companyName,
          packageName: order.packageName,
          submittedAt: order.submittedAt,
          estimatedCompletionDate: order.dueDate,
          completedAt: order.completedAt,
          wizardCompleted: applicant.portalCompleted,
          latestTimelineEntry: timeline ? {
            status: timeline.status,
            description: timeline.description,
            createdAt: timeline.createdAt,
          } : null,
        };
      })
    );

    res.json(successResponse(checks.filter(Boolean)));
  } catch (error) {
    console.error('Error getting checks:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get checks'));
  }
});

// GET /api/v1/checks/:orderId
router.get('/:orderId', authenticateJWT, async (req, res: Response) => {
  try {
    const { orderId } = req.params;

    const applicant = await prisma.applicant.findFirst({
      where: { orderId, userId: req.user!.id },
    });

    if (!applicant) {
      return res.status(403).json(errorResponse('FORBIDDEN', 'Not authorized'));
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { client: true },
    });

    if (!order) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
    }

    const timeline = await prisma.orderTimeline.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    const documents = await prisma.document.findMany({
      where: { orderId },
    });

    const report = await prisma.screeningReport.findFirst({
      where: { orderId, status: 'completed' },
    });

    res.json(successResponse({
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        positionTitle: order.positionTitle,
        companyName: order.client?.companyName,
        packageName: order.packageName,
        services: {
          criminal: order.criminalCheck,
          employment: order.employmentVerification,
          education: order.educationVerification,
          credit: order.creditCheck,
        },
        submittedAt: order.submittedAt,
        completedAt: order.completedAt,
      },
      applicant: {
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        email: applicant.email,
        portalCompleted: applicant.portalCompleted,
        completedSteps: applicant.completedSteps,
      },
      timeline,
      documents: documents.map(d => ({
        id: d.id,
        fileName: d.fileName,
        fileType: d.fileType,
        documentType: d.documentType,
        uploadedAt: d.createdAt,
        fileSize: d.fileSize,
      })),
      report: report ? {
        available: true,
        generatedAt: report.createdAt,
        status: report.status,
      } : { available: false },
    }));
  } catch (error) {
    console.error('Error getting check detail:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get check detail'));
  }
});

// GET /api/v1/checks/:orderId/timeline
router.get('/:orderId/timeline', authenticateJWT, async (req, res: Response) => {
  try {
    const { orderId } = req.params;

    const applicant = await prisma.applicant.findFirst({
      where: { orderId, userId: req.user!.id },
    });

    if (!applicant) {
      return res.status(403).json(errorResponse('FORBIDDEN', 'Not authorized'));
    }

    const timeline = await prisma.orderTimeline.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse({ timeline }));
  } catch (error) {
    console.error('Error getting timeline:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get timeline'));
  }
});

// GET /api/v1/checks/:orderId/report
router.get('/:orderId/report', authenticateJWT, async (req, res: Response) => {
  try {
    const { orderId } = req.params;

    const applicant = await prisma.applicant.findFirst({
      where: { orderId, userId: req.user!.id },
    });

    if (!applicant) {
      return res.status(403).json(errorResponse('FORBIDDEN', 'Not authorized'));
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.status !== 'completed') {
      return res.status(404).json(errorResponse('REPORT_NOT_AVAILABLE', 'Your report is not yet ready.'));
    }

    const report = await prisma.screeningReport.findFirst({
      where: { orderId, status: 'completed' },
    });

    if (!report) {
      return res.status(404).json(errorResponse('REPORT_NOT_AVAILABLE', 'Your report is not yet ready.'));
    }

    res.json(successResponse({
      reportId: report.id,
      generatedAt: report.createdAt,
      status: report.status,
    }));
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get report'));
  }
});

export default router;
