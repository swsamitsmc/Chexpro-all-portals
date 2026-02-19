#!/usr/bin/env node
// Script to create a demo user for testing the login functionality
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function createDemoUser() {
  try {
    // Import database configuration
    const { default: pool } = await import('../config/db.js');

    console.log('🔐 Creating demo user for testing...');

    // Demo user credentials
    const demoUser = {
      username: 'demouser',
      email: 'demo@chexpro.com',
      password: 'DemoPass123!' // This will be hashed
    };

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(demoUser.password, saltRounds);

    console.log(`📧 Demo User: ${demoUser.username}`);
    console.log(`🔑 Demo Password: ${demoUser.password}`);
    console.log('⚠️  Remember to change this password in production!');

    // Insert demo user
    const query = `
      INSERT INTO users (username, email, password_hash, active)
      VALUES (?, ?, ?, TRUE)
      ON DUPLICATE KEY UPDATE
      password_hash = VALUES(password_hash),
      active = TRUE
    `;

    const [result] = await pool.query(query, [demoUser.username, demoUser.email, passwordHash]);

    if (result.affectedRows > 0) {
      console.log('✅ Demo user created successfully!');
      console.log(`🧪 Test the login at: http://localhost:5173/login`);
      console.log(`   Username: ${demoUser.username}`);
      console.log(`   Password: ${demoUser.password}`);
    } else {
      console.log('ℹ️  Demo user already exists');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Failed to create demo user:', error.message);
    process.exit(1);
  }
}

// Run the script
createDemoUser();
