// Environment variable validation utility
const requiredEnvVars = {
  production: [
    'SESSION_SECRET',
    'CSRF_SECRET',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'HEALTH_CHECK_TOKEN',
    'METRICS_TOKEN',
    'MFA_ENCRYPTION_KEY',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'CONTACT_RECIPIENT',
    'DEMO_RECIPIENT',
    'FRONTEND_URL',
    'ALLOWED_ORIGINS',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_DATABASE'
  ],
  development: [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'DEV_FRONTEND_URLS'
  ]
};

export const validateEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredEnvVars[env] || requiredEnvVars.development;
  const missing = [];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error(`Missing required environment variables for ${env}:`, missing.join(', '));
    if (env === 'production') {
      process.exit(1);
    } else {
      console.warn('Application may not function correctly without these variables.');
    }
  }

  console.log(`Environment validation passed for ${env} mode`);
};