import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
const router = express.Router();
import pool from '../config/db.js';
import { jwtAuth } from '../middleware/jwtAuth.js';
import { getSession } from '../sessionStore.js';

// Rate limiting for dashboard endpoints
const dashboardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all dashboard routes
router.use(dashboardLimiter);

/**
 * Middleware to verify user session
 * Supports both JWT token and session-based authentication
 */
const verifySession = async (req, res, next) => {
  try {
    // First, try JWT authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use JWT auth middleware logic
      const jwt = await import('jsonwebtoken');
      const token = authHeader.slice(7);
      
      try {
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET, {
          algorithms: ['HS256'],
          issuer: 'chexpro',
          audience: 'chexpro-users'
        });
        req.user = decoded;
        req.authMethod = 'jwt';
        return next();
      } catch (jwtError) {
        // JWT invalid, try session
      }
    }
    
    // Try session-based authentication
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      const session = await getSession(sessionId);
      if (session && new Date(session.expires_at) > new Date()) {
        req.user = { userId: session.user_id };
        req.authMethod = 'session';
        return next();
      }
    }
    
    // No valid authentication found
    return res.status(401).json({ error: 'Authentication required' });
  } catch (error) {
    console.error('Session verification error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to verify user has access to the requested client resource
 * Prevents IDOR attacks by ensuring users can only access their own data
 */
const verifyClientAccess = async (req, res, next) => {
  try {
    const requestedClientId = req.query.clientId || req.body.clientId;
    
    // If no clientId specified, user can only access their own data
    if (!requestedClientId) {
      // Get user's client_id from database
      const [userRows] = await pool.query(
        'SELECT client_id FROM users WHERE id = ?',
        [req.user.userId]
      );
      
      if (userRows.length > 0 && userRows[0].client_id) {
        req.clientId = userRows[0].client_id;
        return next();
      }
      
      // User has no associated client
      return res.status(403).json({ error: 'No client access configured' });
    }
    
    // Verify user has access to the requested client
    const [accessRows] = await pool.query(
      `SELECT u.id FROM users u 
       WHERE u.id = ? AND u.client_id = ?`,
      [req.user.userId, requestedClientId]
    );
    
    if (accessRows.length === 0) {
      // Check if user is admin (admins can access all clients)
      const [adminCheck] = await pool.query(
        'SELECT role FROM users WHERE id = ?',
        [req.user.userId]
      );
      
      if (adminCheck.length > 0 && adminCheck[0].role === 'admin') {
        req.clientId = requestedClientId;
        return next();
      }
      
      return res.status(403).json({ error: 'Access denied to this client resource' });
    }
    
    req.clientId = requestedClientId;
    next();
  } catch (error) {
    console.error('Client access verification error:', error);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Dashboard statistics endpoint
router.get('/stats', verifySession, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.clientId; // Use validated clientId from middleware

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
router.get('/recent-orders', verifySession, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.clientId;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Cap at 100

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
router.get('/reports', verifySession, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.clientId;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Cap at 100

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
router.get('/batch-invites', verifySession, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.clientId;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Cap at 100

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
router.get('/support-requests', verifySession, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.clientId;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Cap at 100

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
router.post('/orders', verifySession, verifyClientAccess, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const clientId = req.clientId;
    const {
      candidateInfo,
      services,
      priority = 'normal',
      turnaroundTime = 3,
      specialInstructions
    } = req.body;

    // Validate required fields
    if (!candidateInfo || !candidateInfo.firstName || !candidateInfo.lastName || !candidateInfo.email) {
      return res.status(400).json({ error: 'Candidate information is incomplete' });
    }

    // Validate priority
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }

    // Generate order reference
    const orderReference = `BG-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + turnaroundTime);

    // Start transaction for data integrity
    await connection.beginTransaction();

    // Insert candidate if not exists
    const candidateId = crypto.randomBytes(16).toString('hex');
    await connection.query(`
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
    await connection.query(`
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
      services?.criminal || false,
      services?.employment || false,
      services?.education || false,
      services?.credit || false,
      services?.reference || false,
      services?.drug || false,
      turnaroundTime,
      specialInstructions,
      dueDate
    ]);

    // Commit transaction
    await connection.commit();

    res.json({
      success: true,
      orderId,
      orderReference,
      message: 'Background check order created successfully'
    });

  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    connection.release();
  }
});

// Create support request
router.post('/support-requests', verifySession, verifyClientAccess, async (req, res) => {
  try {
    const clientId = req.clientId;
    const {
      type,
      priority,
      subject,
      description,
      urgency
    } = req.body;

    // Validate required fields
    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    // Validate request type
    const validTypes = ['technical', 'billing', 'report_dispute', 'general', 'urgent'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid request type' });
    }

    // Validate priority
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }

    const requestId = crypto.randomBytes(16).toString('hex');
    await pool.query(`
      INSERT INTO support_requests (
        id, client_id, request_type, priority, status, subject, description, urgency_level
      ) VALUES (?, ?, ?, ?, 'open', ?, ?, ?)
    `, [requestId, clientId, type || 'general', priority || 'normal', subject, description, urgency || 'routine']);

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
