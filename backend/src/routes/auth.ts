import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { authenticate } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimiter';
import { sendSuccess, sendError } from '../utils/response';
import { sendEmail, passwordResetEmailTemplate } from '../utils/email';
import { generateToken } from '../utils/helpers';
import { AuthenticatedRequest, JwtPayload } from '../types';

const router = Router();

// Helper: generate tokens
function generateTokenPair(userId: string, clientId: string, email: string, role: string) {
  const accessTokenOptions: SignOptions = { expiresIn: '15m', algorithm: 'HS256' };
  const refreshTokenOptions: SignOptions = { expiresIn: '7d', algorithm: 'HS256' };
  
  const accessToken = jwt.sign(
    { userId, clientId, email, role },
    env.jwtSecret,
    accessTokenOptions
  );
  const refreshToken = jwt.sign(
    { userId, clientId, email, role },
    env.jwtRefreshSecret,
    refreshTokenOptions
  );
  return { accessToken, refreshToken };
}

// POST /api/v1/auth/login
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    rememberMe: z.boolean().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input', 
      parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { client: { select: { id: true, companyName: true, status: true } } },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (user.status !== 'active') {
    return sendError(res, 403, 'ACCOUNT_INACTIVE', 'Account is not active');
  }

  if (user.client.status !== 'active') {
    return sendError(res, 403, 'CLIENT_INACTIVE', 'Client account is suspended or inactive');
  }

  // 2FA check
  if (user.mfaEnabled && user.mfaSecret) {
    return sendSuccess(res, { requiresMfa: true, userId: user.id }, 200);
  }

  const { accessToken, refreshToken } = generateTokenPair(user.id, user.clientId, user.email, user.role);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken, lastLogin: new Date() } });

  return sendSuccess(res, {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      clientId: user.clientId,
      clientName: user.client.companyName,
    },
  });
});

// POST /api/v1/auth/login/2fa
router.post('/login/2fa', loginLimiter, async (req: Request, res: Response) => {
  const { userId, token } = req.body;
  if (!userId || !token) return sendError(res, 400, 'VALIDATION_ERROR', 'userId and token required');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { client: { select: { id: true, companyName: true } } },
  });

  if (!user || !user.mfaSecret) return sendError(res, 400, 'INVALID_REQUEST', 'Invalid request');

  const verified = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: 'base32', token, window: 2 });
  if (!verified) return sendError(res, 401, 'INVALID_2FA_TOKEN', 'Invalid authentication code');

  const { accessToken, refreshToken } = generateTokenPair(user.id, user.clientId, user.email, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken, lastLogin: new Date() } });

  return sendSuccess(res, {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, clientId: user.clientId, clientName: user.client.companyName },
  });
});

// POST /api/v1/auth/refresh-token
router.post('/refresh-token', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return sendError(res, 400, 'VALIDATION_ERROR', 'Refresh token required');

  try {
    const payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || user.refreshToken !== refreshToken || user.status !== 'active') {
      return sendError(res, 401, 'INVALID_TOKEN', 'Invalid refresh token');
    }

    const tokens = generateTokenPair(user.id, user.clientId, user.email, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

    return sendSuccess(res, tokens);
  } catch {
    return sendError(res, 401, 'INVALID_TOKEN', 'Invalid or expired refresh token');
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    await prisma.user.update({ where: { id: req.user.id }, data: { refreshToken: null } });
  }
  return sendSuccess(res, { message: 'Logged out successfully' });
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, firstName: true, lastName: true, role: true, status: true,
      mfaEnabled: true, lastLogin: true, createdAt: true,
      client: { select: { id: true, companyName: true, status: true, branding: true } },
    },
  });
  return sendSuccess(res, user);
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return sendError(res, 400, 'VALIDATION_ERROR', 'Email required');

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent user enumeration
  if (!user) return sendSuccess(res, { message: 'If that email exists, a reset link has been sent.' });

  const token = generateToken(32);
  const expiry = new Date(Date.now() + env.security.passwordResetExpiresMinutes * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });

  const resetLink = `${env.frontendUrl}/reset-password?token=${token}`;
  const template = passwordResetEmailTemplate({
    userName: user.firstName ?? 'User',
    resetLink,
    expiresInMinutes: env.security.passwordResetExpiresMinutes,
  });

  await sendEmail({ to: email, ...template });
  return sendSuccess(res, { message: 'If that email exists, a reset link has been sent.' });
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  const schema = z.object({ token: z.string(), password: z.string().min(8) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input');

  const { token, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token, passwordResetExpiry: { gt: new Date() } },
  });

  if (!user) return sendError(res, 400, 'INVALID_TOKEN', 'Invalid or expired reset token');

  const passwordHash = await bcrypt.hash(password, env.security.bcryptRounds);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null, refreshToken: null },
  });

  return sendSuccess(res, { message: 'Password reset successfully' });
});

// POST /api/v1/auth/2fa/setup
router.post('/2fa/setup', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const secret = speakeasy.generateSecret({ name: `${env.totp.appName} (${req.user!.email})`, length: 20 });
  await prisma.user.update({ where: { id: req.user!.id }, data: { mfaSecret: secret.base32 } });
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);
  return sendSuccess(res, { qrCode, secret: secret.base32 });
});

// POST /api/v1/auth/2fa/verify
router.post('/2fa/verify', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { token } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user?.mfaSecret) return sendError(res, 400, 'NO_MFA_SECRET', '2FA not set up');

  const verified = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: 'base32', token, window: 2 });
  if (!verified) return sendError(res, 400, 'INVALID_TOKEN', 'Invalid verification code');

  await prisma.user.update({ where: { id: req.user!.id }, data: { mfaEnabled: true } });
  return sendSuccess(res, { message: '2FA enabled successfully' });
});

// POST /api/v1/auth/2fa/disable
router.post('/2fa/disable', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { token } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user?.mfaSecret || !user.mfaEnabled) return sendError(res, 400, 'MFA_NOT_ENABLED', '2FA is not enabled');

  const verified = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: 'base32', token, window: 2 });
  if (!verified) return sendError(res, 400, 'INVALID_TOKEN', 'Invalid verification code');

  await prisma.user.update({ where: { id: req.user!.id }, data: { mfaEnabled: false, mfaSecret: null } });
  return sendSuccess(res, { message: '2FA disabled successfully' });
});

export default router;
