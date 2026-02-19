// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { sendError, ErrorCodes, HttpStatus } from '../utils/response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    sendError(res, 'Duplicate entry', HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR);
    return;
  }

  if (err.code === 'P2025') {
    sendError(res, 'Record not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', HttpStatus.UNAUTHORIZED, ErrorCodes.TOKEN_INVALID);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', HttpStatus.UNAUTHORIZED, ErrorCodes.TOKEN_EXPIRED);
    return;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    sendError(res, err.message, HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR);
    return;
  }

  // Default error
  sendError(res, 'Internal server error', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
};