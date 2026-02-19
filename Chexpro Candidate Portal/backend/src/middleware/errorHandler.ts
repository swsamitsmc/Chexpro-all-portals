import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { errorResponse } from '../utils/response';
import logger from '../config/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const field = e.path.join('.');
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(e.message);
    });

    res.status(400).json(
      errorResponse('VALIDATION_ERROR', 'Invalid request data', fieldErrors)
    );
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let message = 'Database operation failed';
    
    switch (err.code) {
      case 'P2002':
        message = 'A record with this value already exists';
        break;
      case 'P2025':
        message = 'Record not found';
        break;
      default:
        message = 'Database error occurred';
    }

    res.status(400).json(errorResponse('DATABASE_ERROR', message));
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json(
      errorResponse('VALIDATION_ERROR', 'Invalid data format')
    );
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json(errorResponse('INVALID_TOKEN', 'Invalid token'));
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json(errorResponse('TOKEN_EXPIRED', 'Token has expired'));
    return;
  }

  const statusCode = (err as { statusCode?: number }).statusCode || 500;
  const message = env.nodeEnv === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json(errorResponse('SERVER_ERROR', message));
};

const env = process.env;
