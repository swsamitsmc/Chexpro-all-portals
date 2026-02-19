import crypto from 'crypto';

export const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const addBusinessDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  let daysAdded = 0;
  
  while (daysAdded < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }
  
  return result;
};

export const maskSIN = (sin: string): string => {
  if (!sin || sin.length < 2) {
    return '***-***-**';
  }
  return `***-***-${sin.slice(-2)}`;
};

export const formatOrderNumber = (id: string): string => {
  const numericPart = id.replace(/[^0-9]/g, '').slice(-6);
  return `CHK-${numericPart.padStart(6, '0')}`;
};

export const hashString = (input: string): string => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
