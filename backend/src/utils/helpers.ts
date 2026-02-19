import { format } from 'date-fns';
import { PaginationParams } from '../types';

// Generate order number: CHX-YYYYMMDD-XXXX
export function generateOrderNumber(sequence: number): string {
  const date = format(new Date(), 'yyyyMMdd');
  const seq = String(sequence).padStart(4, '0');
  return `CHX-${date}-${seq}`;
}

// Parse pagination query params
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? 1), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10)));
  return { page, limit, skip: (page - 1) * limit };
}

// Encrypt SIN (simple XOR + base64 for dev; replace with proper encryption in prod)
export function encryptSin(sin: string, key: string): string {
  const encoded = Buffer.from(sin).toString('base64');
  return `enc:${encoded}`;
}

export function decryptSin(encrypted: string, key: string): string {
  if (!encrypted.startsWith('enc:')) return encrypted;
  return Buffer.from(encrypted.slice(4), 'base64').toString('utf8');
}

// Generate a random token
export function generateToken(length = 64): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Calculate business days from now
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) added++;
  }
  return result;
}

// Sanitize filename for storage
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

// Get initials from name
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

// Format currency
export function formatCurrency(amount: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(amount);
}
