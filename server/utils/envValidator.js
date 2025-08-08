// Environment variable validation utility
const requiredEnvVars = {
  production: [
    'SESSION_SECRET',
    'CSRF_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'CONTACT_RECIPIENT',
    'DEMO_RECIPIENT',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_DATABASE'
  ],
  development: [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS'
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