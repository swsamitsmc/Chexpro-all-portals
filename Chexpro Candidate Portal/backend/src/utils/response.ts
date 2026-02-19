import { Response } from 'express';

interface ErrorDetail {
  [key: string]: string[];
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ErrorDetail;
  };
}

interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export const successResponse = <T>(
  data: T,
  message?: string
): SuccessResponse<T> => {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
};

export const errorResponse = (
  code: string,
  message: string,
  details?: ErrorDetail
): ErrorResponse => {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
};

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response => {
  return res.status(statusCode).json(successResponse(data, message));
};

export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: ErrorDetail
): Response => {
  return res.status(statusCode).json(errorResponse(code, message, details));
};
