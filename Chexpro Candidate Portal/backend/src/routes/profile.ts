import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';
import { authenticateJWT } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { redisClient } from '../config/redis';

const router = Router();

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  preferredName: z.string().optional(),
  timezone: z.string().optional(),
  communicationPrefs: z.object({
    emailNotifications: z.boolean(),
    smsNotifications: z.boolean(),
  }).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase and number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const deleteAccountSchema = z.object({
  password: z.string().min(1),
  confirmDeletion: z.string().refine((val) => val === 'DELETE MY ACCOUNT', {
    message: 'Type DELETE MY ACCOUNT to confirm',
  }),
});

// GET /api/v1/profile
router.get('/', authenticateJWT, async (req, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        candidateProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'User not found'));
    }

    const applicantCount = await prisma.applicant.count({
      where: { userId: user.id },
    });

    const completedCount = await prisma.applicant.count({
      where: { userId: user.id, portalCompleted: true },
    });

    res.json(successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      profile: {
        preferredName: user.candidateProfile?.preferredName,
        communicationPrefs: user.candidateProfile?.communicationPrefs,
        timezone: user.candidateProfile?.timezone,
      },
      stats: {
        totalChecks: applicantCount,
        completedChecks: completedCount,
        pendingChecks: applicantCount - completedCount,
      },
    }));
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get profile'));
  }
});

// PUT /api/v1/profile
router.put('/', authenticateJWT, async (req, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    if (data.preferredName || data.timezone || data.communicationPrefs) {
      await prisma.candidateProfile.upsert({
        where: { userId: req.user!.id },
        update: {
          preferredName: data.preferredName,
          timezone: data.timezone,
          communicationPrefs: data.communicationPrefs as Record<string, unknown>,
        },
        create: {
          userId: req.user!.id,
          preferredName: data.preferredName,
          timezone: data.timezone,
          communicationPrefs: data.communicationPrefs as Record<string, unknown>,
        },
      });
    }

    res.json(successResponse(null, 'Profile updated successfully'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input data'));
    }
    console.error('Error updating profile:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to update profile'));
  }
});

// PUT /api/v1/profile/password
router.put('/password', authenticateJWT, async (req, res: Response) => {
  try {
    const data = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'User not found'));
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);

    if (!isValid) {
      return res.status(400).json(errorResponse('INVALID_PASSWORD', 'Current password is incorrect'));
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash },
    });

    const keys = await redisClient.keys(`blacklist:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    res.json(successResponse(null, 'Password updated'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input data'));
    }
    console.error('Error changing password:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to change password'));
  }
});

// DELETE /api/v1/profile/account
router.delete('/account', authenticateJWT, async (req, res: Response) => {
  try {
    const data = deleteAccountSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'User not found'));
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValid) {
      return res.status(400).json(errorResponse('INVALID_PASSWORD', 'Password is incorrect'));
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        email: `deleted-${user.id}@deleted.com`,
        firstName: '[DELETED]',
        lastName: '[DELETED]',
      },
    });

    res.json(successResponse(null, 'Account deleted'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input data'));
    }
    console.error('Error deleting account:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to delete account'));
  }
});

export default router;
