import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  // Server
  nodeEnv: string;
  port: number;
  apiUrl: string;

  // Database
  databaseUrl: string;

  // Redis
  redisUrl: string;

  // JWT
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;

  // Session
  sessionTimeoutMinutes: number;

  // Security
  bcryptSaltRounds: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;

  // Email
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;

  // File Upload
  maxFileSize: number;
  uploadDir: string;

  // CORS
  corsOrigin: string;

  // Logging
  logLevel: string;

  // Feature Flags
  enableMfa: boolean;
  enableIpWhitelist: boolean;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (value) {
    return parseInt(value, 10);
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Missing required environment variable: ${key}`);
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value) {
    return value.toLowerCase() === 'true';
  }
  return defaultValue;
};

export const config: EnvConfig = {
  // Server
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 3002),
  apiUrl: getEnvVar('API_URL', 'http://localhost:3002'),

  // Database
  databaseUrl: getEnvVar('DATABASE_URL'),

  // Redis
  redisUrl: getEnvVar('REDIS_URL', 'redis://localhost:6379'),

  // JWT
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtRefreshSecret: getEnvVar('JWT_REFRESH_SECRET'),
  jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '15m'),
  jwtRefreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d'),

  // Session
  sessionTimeoutMinutes: getEnvNumber('SESSION_TIMEOUT_MINUTES', 15),

  // Security
  bcryptSaltRounds: getEnvNumber('BCRYPT_SALT_ROUNDS', 12),
  rateLimitWindowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000),
  rateLimitMaxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),

  // Email
  smtpHost: getEnvVar('SMTP_HOST', 'smtp.example.com'),
  smtpPort: getEnvNumber('SMTP_PORT', 587),
  smtpUser: getEnvVar('SMTP_USER', ''),
  smtpPass: getEnvVar('SMTP_PASS', ''),
  smtpFrom: getEnvVar('SMTP_FROM', 'ChexPro Admin <noreply@chexpro.com>'),

  // File Upload
  maxFileSize: getEnvNumber('MAX_FILE_SIZE', 10485760),
  uploadDir: getEnvVar('UPLOAD_DIR', './uploads'),

  // CORS
  corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:3001'),

  // Logging
  logLevel: getEnvVar('LOG_LEVEL', 'info'),

  // Feature Flags
  enableMfa: getEnvBoolean('ENABLE_MFA', true),
  enableIpWhitelist: getEnvBoolean('ENABLE_IP_WHITELIST', false),
};

export default config;