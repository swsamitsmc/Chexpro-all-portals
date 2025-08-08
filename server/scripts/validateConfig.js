#!/usr/bin/env node
// Configuration validation script
import dotenv from 'dotenv';
import { validateEnvironment } from '../utils/envValidator.js';

dotenv.config();

console.log('🔍 Validating ChexPro configuration...\n');

// Environment validation
try {
  validateEnvironment();
  console.log('✅ Environment variables validation passed\n');
} catch (error) {
  console.error('❌ Environment validation failed:', encodeURIComponent(error.message || 'Unknown error'));
  process.exit(1);
}

// Database configuration check
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};

console.log('📊 Database configuration:');
console.log(`   Host: ${dbConfig.host || 'Not configured'}`);
console.log(`   User: ${dbConfig.user || 'Not configured'}`);
console.log(`   Database: ${dbConfig.database || 'Not configured'}`);
console.log(`   Password: ${dbConfig.password ? '***configured***' : 'Not configured'}\n`);

// SMTP configuration check
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS
};

console.log('📧 SMTP configuration:');
console.log(`   Host: ${smtpConfig.host || 'Not configured'}`);
console.log(`   Port: ${smtpConfig.port || 'Not configured'}`);
console.log(`   User: ${smtpConfig.user || 'Not configured'}`);
console.log(`   Password: ${smtpConfig.pass ? '***configured***' : 'Not configured'}\n`);

// Security configuration check
console.log('🔐 Security configuration:');
console.log(`   Session Secret: ${process.env.SESSION_SECRET ? '***configured***' : 'Not configured'}`);
console.log(`   CSRF Secret: ${process.env.CSRF_SECRET ? '***configured***' : 'Not configured'}`);
console.log(`   Health Check Token: ${process.env.HEALTH_CHECK_TOKEN ? '***configured***' : 'Not configured'}`);
console.log(`   Metrics Token: ${process.env.METRICS_TOKEN ? '***configured***' : 'Not configured'}\n`);

console.log('✅ Configuration validation completed successfully!');
console.log('🚀 ChexPro is ready to launch!');