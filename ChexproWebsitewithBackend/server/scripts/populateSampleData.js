#!/usr/bin/env node
// Script to populate sample data for the client dashboard demo
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function populateSampleData() {
  try {
    // Import database configuration
    const { default: pool } = await import('../config/db.js');

    console.log('🗄️ Populating sample data for dashboard demo...');

    // Create demo client
    const clientId = crypto.randomBytes(16).toString('hex');
    await pool.query(`
      INSERT INTO clients (id, company_name, contact_email, contact_phone, industry, company_size, subscription_tier)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE company_name = VALUES(company_name)
    `, [clientId, 'Demo Corporation', 'admin@democorp.com', '+1-555-0123', 'Technology', '100-500', 'premium']);

    console.log('✅ Demo client created');

    // Create sample candidates
    const candidates = [
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@email.com', phone: '+1-555-0001', position: 'Software Engineer' },
      { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@email.com', phone: '+1-555-0002', position: 'Product Manager' },
      { firstName: 'Michael', lastName: 'Brown', email: 'mbrown@email.com', phone: '+1-555-0003', position: 'Sales Director' },
      { firstName: 'Emily', lastName: 'Davis', email: 'emily.d@email.com', phone: '+1-555-0004', position: 'HR Manager' },
      { firstName: 'David', lastName: 'Wilson', email: 'dwilson@email.com', phone: '+1-555-0005', position: 'Marketing Specialist' }
    ];

    const candidateIds = [];
    for (const candidate of candidates) {
      const candidateId = crypto.randomBytes(16).toString('hex');
      await pool.query(`
        INSERT INTO candidates (id, client_id, first_name, last_name, email, phone, position_applied)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [candidateId, clientId, candidate.firstName, candidate.lastName, candidate.email, candidate.phone, candidate.position]);

      candidateIds.push({ id: candidateId, ...candidate });
    }

    console.log(`✅ Created ${candidates.length} sample candidates`);

    // Create sample background check orders
    const orderStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'];
    const priorities = ['low', 'normal', 'high', 'urgent'];

    for (let i = 0; i < 15; i++) {
      const candidate = candidateIds[i % candidateIds.length];
      const orderId = crypto.randomBytes(16).toString('hex');
      const orderReference = `BG-${Date.now()}-${String(i + 1).padStart(3, '0')}`;
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];

      // Calculate dates
      const submittedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const dueDate = new Date(submittedDate.getTime() + (Math.random() * 7 + 3) * 24 * 60 * 60 * 1000); // 3-10 days later

      let startedDate = null;
      let completedDate = null;
      let overallResult = 'pending';

      if (status === 'in_progress') {
        startedDate = new Date(submittedDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
      } else if (status === 'completed') {
        startedDate = new Date(submittedDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
        completedDate = new Date(startedDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000);
        overallResult = Math.random() > 0.1 ? 'clear' : 'caution'; // 90% clear, 10% caution
      }

      await pool.query(`
        INSERT INTO bg_orders (
          id, client_id, candidate_id, order_reference, status, priority,
          criminal_check, employment_verification, education_verification,
          credit_check, reference_check, drug_screening,
          submitted_at, started_at, completed_at, due_date, overall_result
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId, clientId, candidate.id, orderReference, status, priority,
        Math.random() > 0.3, Math.random() > 0.2, Math.random() > 0.4,
        Math.random() > 0.6, Math.random() > 0.5, Math.random() > 0.7,
        submittedDate, startedDate, completedDate, dueDate, overallResult
      ]);
    }

    console.log('✅ Created 15 sample background check orders');

    // Create sample screening reports
    const [orders] = await pool.query(`
      SELECT id, candidate_id FROM bg_orders WHERE client_id = ? LIMIT 10
    `, [clientId]);

    for (const order of orders) {
      const reportId = crypto.randomBytes(16).toString('hex');
      const reportTypes = ['criminal', 'employment', 'education', 'credit', 'reference'];
      const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
      const riskLevels = ['low', 'medium', 'high'];
      const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

      await pool.query(`
        INSERT INTO screening_reports (id, order_id, report_type, status, risk_level, findings)
        VALUES (?, ?, ?, 'completed', ?, ?)
      `, [
        reportId, order.id, `Background Check${reportType}`,
        riskLevel, `Sample findings for ${reportType} check - Risk level: ${riskLevel}`
      ]);
    }

    console.log('✅ Created sample screening reports');

    // Create sample support requests
    const supportTypes = ['technical', 'billing', 'report_dispute', 'general'];
    const supportPriorities = ['low', 'normal', 'high', 'urgent'];

    for (let i = 0; i < 8; i++) {
      const requestId = crypto.randomBytes(16).toString('hex');
      const type = supportTypes[Math.floor(Math.random() * supportTypes.length)];
      const priority = supportPriorities[Math.floor(Math.random() * supportPriorities.length)];
      const status = i < 5 ? 'resolved' : 'open'; // Most are resolved

      await pool.query(`
        INSERT INTO support_requests (id, client_id, request_type, priority, status, subject, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        requestId, clientId, type, priority, status,
        `Support Request #${i + 1}`,
        `This is a sample support request for ${type} issue with priority ${priority}.`
      ]);
    }

    console.log('✅ Created 8 sample support requests');

    console.log('\n🎉 Sample data population completed!');
    console.log('\n📊 Dashboard Features Available:');
    console.log('   • Real-time statistics and counts');
    console.log('   • Recent orders with status tracking');
    console.log('   • Interactive charts and analytics');
    console.log('   • Support ticket management');
    console.log('   • Batch operations support');
    console.log('\n🔗 Access the dashboard at: http://localhost:5173/dashboard');
    console.log('   (Make sure to login first at: http://localhost:5173/login)');

    process.exit(0);

  } catch (error) {
    console.error('❌ Failed to populate sample data:', error.message);
    process.exit(1);
  }
}

// Run the script
populateSampleData();
