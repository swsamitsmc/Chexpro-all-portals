import { Response, NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { sendError } from '../utils/response';
import { AuthenticatedRequest, JwtPayload } from '../types';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, clientId: true, email: true, role: true, status: true, firstName: true, lastName: true },
    });

    if (!user || user.status !== 'active') {
      sendError(res, 401, 'UNAUTHORIZED', 'Invalid or expired token');
      return;
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch {
    sendError(res, 401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    (req as AuthenticatedRequest).user = payload as unknown as AuthenticatedRequest['user'];
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
};
