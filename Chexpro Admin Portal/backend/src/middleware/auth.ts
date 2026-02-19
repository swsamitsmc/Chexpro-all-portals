// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import config from '../config/env';
import { AuthenticatedRequest, AdminUserPayload } from '../types';
import { sendError, ErrorCodes, HttpStatus } from '../utils/response';

// JWT options
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwtSecret,
  passReqToCallback: true,
};

// Configure JWT strategy
passport.use(
  new JwtStrategy(jwtOptions, async (req: Request, payload: AdminUserPayload, done: any) => {
    try {
      const user = await prisma.adminUser.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          mfaEnabled: true,
          mfaRequired: true,
        },
      });

      if (!user) {
        return done(null, false);
      }

      if (user.status !== 'active') {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Authentication middleware
export const authenticate = (passport: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
      if (err) {
        return sendError(res, 'Authentication error', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
      }

      if (!user) {
        let code = ErrorCodes.TOKEN_INVALID;
        if (info?.name === 'TokenExpiredError') {
          code = ErrorCodes.TOKEN_EXPIRED;
        }
        return sendError(res, 'Unauthorized', HttpStatus.UNAUTHORIZED, code);
      }

      req.user = user;
      next();
    })(req, res, next);
  };
};

// Permission check middleware
export const requirePermission = (resource: string, action: 'create' | 'read' | 'update' | 'delete' | 'manage') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const adminReq = req as AuthenticatedRequest;
    
    if (!adminReq.adminUser) {
      return sendError(res, 'Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED);
    }

    const role = adminReq.adminUser.role;
    
    // Super admin has all permissions
    if (role === 'super_admin') {
      return next();
    }

    // Check permissions based on role
    const permissions: Record<string, Record<string, string[]>> = {
      operations_manager: {
        orders: ['create', 'read', 'update', 'manage'],
        clients: ['read'],
        qa: ['read'],
        adjudication: ['read'],
        vendors: ['read'],
        team: ['read'],
      },
      processor: {
        orders: ['read', 'update'],
        clients: ['read'],
      },
      qa_specialist: {
        orders: ['read'],
        qa: ['read', 'update'],
      },
      client_success_mgr: {
        clients: ['create', 'read', 'update'],
      },
      credentialing_spec: {
        clients: ['create', 'read', 'update'],
      },
      compliance_officer: {
        orders: ['read'],
        clients: ['read'],
        team: ['read'],
      },
    };

    const rolePermissions = permissions[role];
    if (!rolePermissions || !rolePermissions[resource]?.includes(action)) {
      return sendError(res, 'Insufficient permissions', HttpStatus.FORBIDDEN, ErrorCodes.FORBIDDEN);
    }

    next();
  };
};

// Generate tokens
export const generateTokens = (user: any) => {
  const payload: AdminUserPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

// Verify refresh token
export const verifyRefreshToken = (token: string): AdminUserPayload | null => {
  try {
    return jwt.verify(token, config.jwtSecret) as AdminUserPayload;
  } catch {
    return null;
  }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

// Compare password
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};