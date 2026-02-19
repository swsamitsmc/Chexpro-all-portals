/**
 * Zitadel Authentication Routes
 * 
 * API endpoints for Zitadel authentication and user management.
 */

import express from 'express';
import { 
  zitadelAuth, 
  optionalZitadelAuth, 
  requireZitadelRole,
  requireAdmin,
  getZitadelDiscovery 
} from '../middleware/zitadelAuth.js';

const router = express.Router();

/**
 * GET /api/zitadel/discovery
 * Get Zitadel OpenID Connect discovery document
 */
router.get('/discovery', (req, res) => {
  res.json(getZitadelDiscovery());
});

/**
 * GET /api/zitadel/me
 * Get current user info from Zitadel token
 */
router.get('/me', zitadelAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * GET /api/zitadel/roles
 * Get user's roles from Zitadel token
 */
router.get('/roles', zitadelAuth, (req, res) => {
  res.json({
    success: true,
    roles: req.user.roles || [],
  });
});

/**
 * POST /api/zitadel/verify
 * Verify a Zitadel access token
 */
router.post('/verify', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const { verifyZitadelToken } = await import('../middleware/zitadelAuth.js');
    const payload = await verifyZitadelToken(token);
    
    res.json({
      valid: true,
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        roles: payload.roles || [],
      },
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/zitadel/admin/users
 * List users (admin only) - requires Zitadel management API access
 */
router.get('/admin/users', zitadelAuth, requireAdmin, async (req, res) => {
  // This would typically call Zitadel's Management API
  // For now, return a placeholder response
  res.json({
    success: true,
    message: 'User listing requires Zitadel Management API integration',
    users: [],
  });
});

/**
 * GET /api/zitadel/admin/stats
 * Get authentication statistics (admin only)
 */
router.get('/admin/stats', zitadelAuth, requireAdmin, (req, res) => {
  // Placeholder for stats
  res.json({
    success: true,
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      loginCount: 0,
    },
  });
});

/**
 * POST /api/zitadel/admin/sync-roles
 * Sync user roles from Zitadel to local database (admin only)
 */
router.post('/admin/sync-roles', zitadelAuth, requireAdmin, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  // Placeholder for role sync
  res.json({
    success: true,
    message: `Roles synced for user ${userId}`,
  });
});

/**
 * GET /api/zitadel/employer/dashboard
 * Example employer-only route
 */
router.get('/employer/dashboard', zitadelAuth, requireZitadelRole(['employer', 'admin']), (req, res) => {
  res.json({
    success: true,
    dashboard: 'Employer Dashboard',
    user: req.user,
  });
});

/**
 * GET /api/zitadel/candidate/dashboard
 * Example candidate-only route
 */
router.get('/candidate/dashboard', zitadelAuth, requireZitadelRole(['candidate']), (req, res) => {
  res.json({
    success: true,
    dashboard: 'Candidate Dashboard',
    user: req.user,
  });
});

export default router;
