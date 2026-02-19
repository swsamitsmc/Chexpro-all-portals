import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { authenticateJWT } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimiter';
import { successResponse, errorResponse } from '../utils/response';
import { generateToken, generateResetToken } from '../utils/helpers';
import { encryptField, decryptField } from '../services/encryptionService';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService';
import { redisClient } from '../config/redis';
import { publishCandidateRegistered } from '../services/redisPublisher';

const router = Router();

const registerSchema = z.object({
  invitationToken: z.string().min(1),
  password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase and number'),
  confirmPassword: z.string(),
  preferredName: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, 'Terms must be accepted'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase and number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: '15m' } as SignOptions
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwtRefreshSecret,
    { expiresIn: '7d' } as SignOptions
  );

  return { accessToken, refreshToken };
};

// GET /api/v1/auth/invitation/:token
router.get('/invitation/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.candidateInvitation.findUnique({
      where: { invitationToken: token },
      include: {
        user: true,
      },
    });

    if (!invitation) {
      return res.status(404).json(errorResponse('INVALID_TOKEN', 'Invalid invitation token'));
    }

    if (invitation.tokenExpiresAt < new Date()) {
      return res.status(410).json(errorResponse('TOKEN_EXPIRED', 'This invitation has expired. Please contact the employer.'));
    }

    if (invitation.registrationCompletedAt) {
      return res.status(409).json(errorResponse('ALREADY_REGISTERED', 'An account already exists for this invitation. Please log in.'));
    }

    const order = await prisma.order.findUnique({
      where: { id: invitation.orderId },
      include: { client: true },
    });

    res.json(successResponse({
      valid: true,
      applicantEmail: invitation.applicantEmail,
      companyName: order?.client?.companyName || 'Unknown Company',
      positionTitle: order?.positionTitle || 'Unknown Position',
      expiresAt: invitation.tokenExpiresAt,
    }));
  } catch (error) {
    console.error('Error validating invitation:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to validate invitation'));
  }
});

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const invitation = await prisma.candidateInvitation.findUnique({
      where: { invitationToken: data.invitationToken },
    });

    if (!invitation) {
      return res.status(404).json(errorResponse('INVALID_TOKEN', 'Invalid invitation token'));
    }

    if (invitation.tokenExpiresAt < new Date()) {
      return res.status(410).json(errorResponse('TOKEN_EXPIRED', 'This invitation has expired.'));
    }

    if (invitation.registrationCompletedAt) {
      return res.status(409).json(errorResponse('ALREADY_REGISTERED', 'An account already exists.'));
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.applicantEmail },
    });

    if (existingUser) {
      return res.status(409).json(errorResponse('EMAIL_EXISTS', 'An account with this email already exists.'));
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const order = await prisma.order.findUnique({
      where: { id: invitation.orderId },
    });

    const newUser = await prisma.user.create({
      data: {
        email: invitation.applicantEmail,
        passwordHash,
        role: 'candidate',
        firstName: '',
        lastName: '',
        clientId: order?.clientId,
        isActive: true,
      },
    });

    await prisma.candidateProfile.create({
      data: {
        userId: newUser.id,
        preferredName: data.preferredName,
      },
    });

    await prisma.candidateInvitation.update({
      where: { id: invitation.id },
      data: {
        registrationCompletedAt: new Date(),
        userId: newUser.id,
      },
    });

    if (order?.applicantId) {
      await prisma.applicant.update({
        where: { id: order.applicantId },
        data: { userId: newUser.id },
      });
    }

    const tokens = generateTokens(newUser);

    const wizardUrl = order ? `${env.frontendUrl}/wizard/${order.id}` : `${env.frontendUrl}/dashboard`;

    try {
      await sendWelcomeEmail(newUser.email, {
        companyName: order?.client?.companyName || 'Unknown',
        positionTitle: order?.positionTitle || 'Unknown',
        wizardUrl,
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    await publishCandidateRegistered({
      orderId: invitation.orderId,
      userId: newUser.id,
      email: newUser.email,
    });

    res.status(201).json(successResponse({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: newUser.id, email: newUser.email, role: newUser.role },
      pendingCheckOrderId: invitation.orderId,
    }, 'Registration successful'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input data', error.errors.reduce((acc, e) => {
        acc[e.path.join('.')] = [e.message];
        return acc;
      }, {} as Record<string, string[]>)));
    }
    console.error('Registration error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Registration failed'));
  }
});

// POST /api/v1/auth/login
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || user.role !== 'candidate' || !user.isActive) {
      return res.status(401).json(errorResponse('INVALID_CREDENTIALS', 'Invalid email or password'));
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json(errorResponse('INVALID_CREDENTIALS', 'Invalid email or password'));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = generateTokens(user);

    res.json(successResponse({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input data'));
    }
    console.error('Login error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Login failed'));
  }
});

// POST /api/v1/auth/refresh-token
router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    const data = refreshSchema.parse(req.body);

    const decoded = jwt.verify(data.refreshToken, env.jwtRefreshSecret) as { id: string; email: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive) {
      return res.status(401).json(errorResponse('INVALID_TOKEN', 'User not found'));
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: '15m' } as SignOptions
    );

    res.json(successResponse({ accessToken }));
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json(errorResponse('INVALID_TOKEN', 'Invalid or expired refresh token'));
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await redisClient.setEx(`blacklist:${refreshToken}`, 7 * 24 * 60 * 60, 'blacklisted');
    }

    res.json(successResponse(null, 'Logged out successfully'));
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Logout failed'));
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (user && user.role === 'candidate') {
      const resetToken = generateResetToken();
      await redisClient.setEx(`pwd_reset:${resetToken}`, 3600, user.id);

      const resetUrl = `${env.frontendUrl}/reset-password?token=${resetToken}`;

      try {
        await sendPasswordResetEmail(user.email, { resetUrl });
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
      }
    }

    res.json(successResponse(null, 'If an account exists, we\'ve sent a reset link.'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid email address'));
    }
    console.error('Forgot password error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to process request'));
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const data = resetPasswordSchema.parse(req.body);

    const userId = await redisClient.get(`pwd_reset:${data.token}`);

    if (!userId) {
      return res.status(400).json(errorResponse('INVALID_OR_EXPIRED_TOKEN', 'Invalid or expired reset token'));
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await redisClient.del(`pwd_reset:${data.token}`);

    res.json(successResponse(null, 'Password updated successfully'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input data'));
    }
    console.error('Reset password error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to reset password'));
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateJWT, async (req: Request, res: Response) => {
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

    res.json(successResponse({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      preferredName: user.candidateProfile?.preferredName,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      pendingChecks: applicantCount,
    }));
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get user info'));
  }
});

export default router;
