import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, defaultValue = ''): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '3001'), 10),
  frontendUrl: optional('FRONTEND_URL', 'http://localhost:5173'),
  candidatePortalUrl: optional('CANDIDATE_PORTAL_URL', 'http://localhost:5174'),
  apiUrl: optional('API_URL', 'http://localhost:3001'),

  databaseUrl: optional('DATABASE_URL', 'mysql://portal_user:portal_password@localhost:3306/chexpro_portal_db'),
  redisUrl: optional('REDIS_URL', 'redis://localhost:6379'),

  jwtSecret: optional('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
  jwtRefreshSecret: optional('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
  jwtAccessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
  jwtRefreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),

  encryptionKey: optional('ENCRYPTION_KEY', 'dev-encryption-key-change-in-production-32'),

  smtp: {
    host: optional('SMTP_HOST', 'localhost'),
    port: parseInt(optional('SMTP_PORT', '587'), 10),
    secure: optional('SMTP_SECURE', 'false') === 'true',
    user: optional('SMTP_USER'),
    pass: optional('SMTP_PASS'),
    from: optional('SMTP_FROM', 'ChexPro <noreply@chexpro.com>'),
  },

  fileStorage: {
    type: optional('FILE_STORAGE_TYPE', 'local') as 'local' | 'oci',
    uploadPath: optional('FILE_UPLOAD_PATH', './uploads'),
    maxFileSizeMb: parseInt(optional('MAX_FILE_SIZE_MB', '10'), 10),
  },

  oci: {
    namespace: optional('OCI_NAMESPACE'),
    bucketName: optional('OCI_BUCKET_NAME', 'chexpro-portal-docs'),
    s3Endpoint: optional('OCI_S3_ENDPOINT'),
    accessKey: optional('OCI_ACCESS_KEY'),
    secretKey: optional('OCI_SECRET_KEY'),
    region: optional('OCI_REGION', 'ca-toronto-1'),
  },

  vendors: {
    cleara: {
      apiUrl: optional('CLEARA_API_URL'),
      apiKey: optional('CLEARA_API_KEY'),
      webhookSecret: optional('CLEARA_WEBHOOK_SECRET'),
    },
    accurateSource: {
      apiUrl: optional('ACCURATE_SOURCE_API_URL'),
      apiKey: optional('ACCURATE_SOURCE_API_KEY'),
      webhookSecret: optional('ACCURATE_SOURCE_WEBHOOK_SECRET'),
    },
    baxter: {
      apiUrl: optional('BAXTER_API_URL'),
      apiKey: optional('BAXTER_API_KEY'),
      webhookSecret: optional('BAXTER_WEBHOOK_SECRET'),
    },
    ferretly: {
      apiUrl: optional('FERRETLY_API_URL'),
      apiKey: optional('FERRETLY_API_KEY'),
      webhookSecret: optional('FERRETLY_WEBHOOK_SECRET'),
    },
    informData: {
      apiUrl: optional('INFORM_DATA_API_URL'),
      apiKey: optional('INFORM_DATA_API_KEY'),
      webhookSecret: optional('INFORM_DATA_WEBHOOK_SECRET'),
    },
  },

  n8n: {
    webhookBaseUrl: optional('N8N_WEBHOOK_BASE_URL'),
    apiKey: optional('N8N_API_KEY'),
  },

  security: {
    bcryptRounds: parseInt(optional('BCRYPT_ROUNDS', '12'), 10),
    rateLimitWindowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    rateLimitMaxRequests: parseInt(optional('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
    loginRateLimitMax: parseInt(optional('LOGIN_RATE_LIMIT_MAX', '5'), 10),
    invitationTokenExpiresDays: parseInt(optional('INVITATION_TOKEN_EXPIRES_DAYS', '14'), 10),
    passwordResetExpiresMinutes: parseInt(optional('PASSWORD_RESET_EXPIRES_MINUTES', '60'), 10),
  },

  totp: {
    appName: optional('TOTP_APP_NAME', 'ChexPro Portal'),
  },

  stripeSecretKey: optional('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: optional('STRIPE_WEBHOOK_SECRET'),

  isDevelopment: optional('NODE_ENV', 'development') === 'development',
  isProduction: optional('NODE_ENV', 'development') === 'production',
};
