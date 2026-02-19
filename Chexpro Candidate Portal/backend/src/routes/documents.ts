import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/prisma';
import { authenticateJWT } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id || 'temp';
    const dir = path.join(process.cwd(), 'uploads', 'documents', userId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/heic'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// GET /api/v1/documents
router.get('/', authenticateJWT, async (req, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      where: {
        uploadedBy: req.user!.id,
      },
      include: {
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(documents.map(d => ({
      id: d.id,
      fileName: d.fileName,
      fileType: d.fileType,
      documentType: d.documentType,
      uploadedAt: d.createdAt,
      fileSize: d.fileSize,
      orderId: d.orderId,
    }))));
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get documents'));
  }
});

// POST /api/v1/documents/upload
router.post('/upload', authenticateJWT, uploadLimiter, upload.single('file'), async (req, res: Response) => {
  try {
    const { orderId, documentType } = req.body;

    if (!req.file) {
      return res.status(400).json(errorResponse('NO_FILE', 'No file uploaded'));
    }

    if (!orderId || !documentType) {
      return res.status(400).json(errorResponse('MISSING_FIELDS', 'orderId and documentType are required'));
    }

    const applicant = await prisma.applicant.findFirst({
      where: { orderId, userId: req.user!.id },
    });

    if (!applicant) {
      return res.status(403).json(errorResponse('FORBIDDEN', 'Not authorized'));
    }

    const document = await prisma.document.create({
      data: {
        applicantId: applicant.id,
        orderId,
        uploadedBy: req.user!.id,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        documentType,
      },
    });

    res.status(201).json(successResponse({
      documentId: document.id,
      fileName: document.fileName,
      uploadedAt: document.createdAt,
    }));
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to upload document'));
  }
});

// DELETE /api/v1/documents/:id
router.delete('/:id', authenticateJWT, async (req, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!document) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Document not found'));
    }

    if (document.uploadedBy !== req.user!.id) {
      return res.status(403).json(errorResponse('FORBIDDEN', 'Not authorized'));
    }

    if (document.order && ['completed', 'in_progress'].includes(document.order.status)) {
      return res.status(400).json(errorResponse('CANNOT_DELETE', 'Cannot delete document for completed or in-progress checks'));
    }

    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await prisma.document.delete({ where: { id } });

    res.json(successResponse(null, 'Document deleted'));
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to delete document'));
  }
});

export default router;
