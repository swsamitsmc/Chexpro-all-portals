// @ts-nocheck
import { Router, Request, Response } from 'express';
import passport from 'passport';
import { body, validationResult } from 'express-validator';
import prisma from '../config/prisma';
import { authenticate, generateTokens, verifyRefreshToken, hashPassword, comparePassword } from '../middleware/auth';
import { sendError, sendSuccess, ErrorCodes, HttpStatus } from '../utils/response';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login admin user
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        sendError(res, 'Validation failed', HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR, errors.array());
        return;
      }

      const { email, password } = req.body;

      const user = await prisma.adminUser.findUnique({ where: { email } });
      if (!user) {
        sendError(res, 'Invalid credentials', HttpStatus.UNAUTHORIZED, ErrorCodes.INVALID_CREDENTIALS);
        return;
      }

      if (user.status !== 'active') {
        sendError(res, 'Account is not active', HttpStatus.FORBIDDEN, ErrorCodes.FORBIDDEN);
        return;
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        sendError(res, 'Invalid credentials', HttpStatus.UNAUTHORIZED, ErrorCodes.INVALID_CREDENTIALS);
        return;
      }

      const tokens = generateTokens(user);

      await prisma.adminUser.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        ...tokens,
      });
    } catch (error) {
      console.error('Login error:', error);
      sendError(res, 'Login failed', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
    }
  }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      sendError(res, 'Refresh token required', HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR);
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      sendError(res, 'Invalid refresh token', HttpStatus.UNAUTHORIZED, ErrorCodes.TOKEN_INVALID);
      return;
    }

    const user = await prisma.adminUser.findUnique({ where: { id: payload.id } });
    if (!user || user.status !== 'active') {
      sendError(res, 'User not found or inactive', HttpStatus.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED);
      return;
    }

    const tokens = generateTokens(user);
    sendSuccess(res, tokens);
  } catch (error) {
    console.error('Refresh token error:', error);
    sendError(res, 'Token refresh failed', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    sendError(res, 'Failed to get user', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate(passport), async (req: Request, res: Response): Promise<void> => {
  try {
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, 'Logout failed', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
  }
});

export default router;