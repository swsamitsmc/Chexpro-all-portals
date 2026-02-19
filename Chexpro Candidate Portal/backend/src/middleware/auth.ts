import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { errorResponse } from '../utils/response';

export interface CandidateUser {
  id: string;
  email: string;
  role: string;
  applicantId?: string;
}

export interface AuthRequest extends Request {
  user?: CandidateUser;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json(errorResponse('UNAUTHORIZED', 'No token provided'));
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Invalid token format'));
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as CandidateUser;
    
    if (decoded.role !== 'candidate') {
      res.status(403).json(errorResponse('FORBIDDEN', 'Access denied'));
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json(errorResponse('TOKEN_EXPIRED', 'Token has expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json(errorResponse('INVALID_TOKEN', 'Invalid token'));
    } else {
      res.status(401).json(errorResponse('UNAUTHORIZED', 'Authentication failed'));
    }
  }
};
