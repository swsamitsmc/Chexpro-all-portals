import { Response } from 'express';
import { ApiSuccess, ApiError, ApiMeta } from '../types';

function buildMeta(extra?: Partial<ApiMeta>): ApiMeta {
  return { timestamp: new Date().toISOString(), ...extra };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Partial<ApiMeta>
): Response {
  const response: ApiSuccess<T> = {
    success: true,
    data,
    meta: buildMeta(meta),
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Array<{ field: string; message: string }>
): Response {
  const response: ApiError = {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
    meta: buildMeta(),
  };
  return res.status(statusCode).json(response);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): Response {
  return sendSuccess(res, data, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
