import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
const router = express.Router();
import pool from '../config/db.js';

// Rate limiting for dashboard endpoints
const dashboardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all dashboard routes
router.use(dashboardLimiter);

// Middleware to verify user session (placeholder for now)
const verifySession = (req, res, next) => {
  // TODO: Implement proper session verification
  // For now, allow all requests (demo purposes)
  next();
};

// Dashboard statistics endpoint
router.get('/stats', verifySession, async (req, res) => {
  try {
    const clientId = req.query.clientId || 'demo-client'; // TODO: Get from session

    // Get counts for status cards
    const [orderStats] = await pool.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM bg_orders
      WHERE client_id = ?
      GROUP BY status
    `, [clientId]);

    const [reportStats] = await pool.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM screening_reports sr
      JOIN bg_orders bo ON sr.order_id = bo.id
      WHERE bo.client_id = ?
      GROUP BY status
    `, [clientId]);

    const [supportStats] = await pool.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM support_requests
      WHERE client_id = ?
      GROUP BY status
    `, [clientId]);

    // Get turnaround time data (last 30 days)
    const [turnaroundData] = await pool.query(`
      SELECT
        DATE(completed_at) as date,
        AVG(TIMESTAMPDIFF(HOUR, submitted_at, completed_at) / 24) as avg_days
      FROM bg_orders
      WHERE client_id = ?
        AND completed_at IS NOT NULL
        AND submitted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(completed_at)
      ORDER BY date
    `, [clientId]);

    // Format the data for frontend
    const stats = {
      orders: {
        pending: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        on_hold: 0
      },
      reports: {
        pending: 0,
        completed: 0,
        failed: 0
      },
      support: {
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0
      },
      turnaround: turnaroundData.map(item => ({
        date: item.date,
        value: Math.round(item.avg_days * 10) / 10
      }))
    };

    // Map database results to stats object
    orderStats.forEach(stat => {
      if (stats.orders.hasOwnProperty(stat.status)) {
        stats.orders[stat.status] = stat.count;
      }
    });

    reportStats.forEach(stat => {
      if (stats.reports.hasOwnProperty(stat.status)) {
        stats.reports[stat.status] = stat.count;
      }
    });

    supportStats.forEach(stat => {
      if (stats.support.hasOwnProperty(stat.status)) {
        stats.support[stat.status] = stat.count;
      }
    });

    res.json(stats);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Recent orders endpoint
router.get('/recent-orders', verifySession, async (req, res) => {
  try {
    const clientId = req.query.clientId || 'demo-client';
    const limit = parseInt(req.query.limit) || 10;

    const [orders] = await pool.query(`
      SELECT
        bo.id,
        bo.order_reference,
        bo.status,
        bo.priority,
        bo.submitted_at,
        bo.due_date,
        bo.overall_result,
        c.first_name,
        c.last_name,
        c.position_applied
      FROM bg_orders bo
      JOIN candidates c ON bo.candidate_id = c.id
      WHERE bo.client_id = ?
      ORDER BY bo.submitted_at DESC
      LIMIT ?
    `, [clientId, limit]);

    res.json(orders);

  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
});

// Reports endpoint
router.get('/reports', verifySession, async (req, res) => {
  try {
    const clientId = req.query.clientId || 'demo-client';
    const limit = parseInt(req.query.limit) || 20;

    const [reports] = await pool.query(`
      SELECT
        sr.id,
        sr.report_type,
        sr.status,
        sr.risk_level,
        sr.findings,
        sr.created_at,
        bo.order_reference,
        c.first_name,
        c.last_name
      FROM screening_reports sr
      JOIN bg_orders bo ON sr.order_id = bo.id
      JOIN candidates c ON bo.candidate_id = c.id
      WHERE bo.client_id = ?
      ORDER BY sr.created_at DESC
      LIMIT ?
    `, [clientId, limit]);

    res.json(reports);

  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Batch invites endpoint
router.get('/batch-invites', verifySession, async (req, res) => {
  try {
    const clientId = req.query.clientId || 'demo-client';
    const limit = parseInt(req.query.limit) || 10;

    const [batches] = await pool.query(`
      SELECT
        id,
        batch_name,
        status,
        total_invites,
        completed_invites,
        failed_invites,
        created_at
      FROM batch_invites
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [clientId, limit]);

    res.json(batches);

  } catch (error) {
    console.error('Batch invites error:', error);
    res.status(500).json({ error: 'Failed to fetch batch invites' });
  }
});

// Support requests endpoint
router.get('/support-requests', verifySession, async (req, res) => {
  try {
    const clientId = req.query.clientId || 'demo-client';
    const limit = parseInt(req.query.limit) || 10;

    const [requests] = await pool.query(`
      SELECT
        id,
        request_type,
        priority,
        status,
        subject,
        created_at,
        resolved_at
      FROM support_requests
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [clientId, limit]);

    res.json(requests);

  } catch (error) {
    console.error('Support requests error:', error);
    res.status(500).json({ error: 'Failed to fetch support requests' });
  }
});

// Create new background check order
router.post('/orders', verifySession, async (req, res) => {
  try {
    const clientId = req.body.clientId || 'demo-client';
    const {
      candidateInfo,
      services,
      priority = 'normal',
      turnaroundTime = 3,
      specialInstructions
    } = req.body;

    // Generate order reference
    const orderReference = `BG-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + turnaroundTime);

    // Insert candidate if not exists
    const candidateId = crypto.randomBytes(16).toString('hex');
    await pool.query(`
      INSERT INTO candidates (id, client_id, first_name, last_name, email, phone, position_applied)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      candidateId,
      clientId,
      candidateInfo.firstName,
      candidateInfo.lastName,
      candidateInfo.email,
      candidateInfo.phone,
      candidateInfo.position
    ]);

    // Insert order
    const orderId = crypto.randomBytes(16).toString('hex');
    await pool.query(`
      INSERT INTO bg_orders (
        id, client_id, candidate_id, order_reference, status, priority,
        criminal_check, employment_verification, education_verification,
        credit_check, reference_check, drug_screening,
        turnaround_time_requested, special_instructions, due_date
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId,
      clientId,
      candidateId,
      orderReference,
      priority,
      services.criminal,
      services.employment,
      services.education,
      services.credit,
      services.reference,
      services.drug,
      turnaroundTime,
      specialInstructions,
      dueDate
    ]);

    res.json({
      success: true,
      orderId,
      orderReference,
      message: 'Background check order created successfully'
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Create support request
router.post('/support-requests', verifySession, async (req, res) => {
  try {
    const clientId = req.body.clientId || 'demo-client';
    const {
      type,
      priority,
      subject,
      description,
      urgency
    } = req.body;

    const requestId = crypto.randomBytes(16).toString('hex');
    await pool.query(`
      INSERT INTO support_requests (
        id, client_id, request_type, priority, status, subject, description, urgency_level
      ) VALUES (?, ?, ?, ?, 'open', ?, ?, ?)
    `, [requestId, clientId, type, priority, subject, description, urgency]);

    res.json({
      success: true,
      requestId,
      message: 'Support request created successfully'
    });

  } catch (error) {
    console.error('Create support request error:', error);
    res.status(500).json({ error: 'Failed to create support request' });
  }
});

export default router;
