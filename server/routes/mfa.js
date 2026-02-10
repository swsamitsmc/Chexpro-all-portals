import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { jwtAuth } from '../middleware/jwtAuth.js';
import {
  generateMfaSecret,
  generateMfaQrCode,
  verifyMfaCode,
  generateRecoveryCodes,
  hashRecoveryCode,
  disableMfa,
  checkMfaStatus
} from '../utils/mfa.js';

const router = express.Router();

// Rate limiting for MFA endpoints
const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many requests, please try again later'
});

/**
 * Get MFA setup information (requires authentication)
 * Returns QR code and secret for setting up authenticator app
 */
router.get('/mfa/setup', jwtAuth, mfaLimiter, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Check if MFA is already enabled
    const status = await checkMfaStatus(userId);
    if (status.enabled) {
      return res.status(400).json({ error: 'MFA is already enabled' });
    }
    
    // Generate new secret
    const secret = generateMfaSecret();
    
    // Generate QR code
    const userEmail = req.user.username || `user${userId}`;
    const qrData = await generateMfaQrCode('ChexPro', userEmail, secret);
    
    res.json({
      secret: qrData.secret,
      qrCode: qrData.qrCode,
      otpauthUrl: qrData.otpauthUrl
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({ error: 'Failed to generate MFA setup' });
  }
});

/**
 * Verify MFA setup with a code from the authenticator app
 */
router.post('/mfa/verify-setup', jwtAuth, mfaLimiter, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { code, secret } = req.body;
    
    if (!code || !secret) {
      return res.status(400).json({ error: 'Code and secret are required' });
    }
    
    // Verify the code
    const isValid = verifyMfaCode(secret, code);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid code. Please try again.' });
    }
    
    // Generate and hash recovery codes
    const recoveryCodes = generateRecoveryCodes(10);
    const hashedCodes = await Promise.all(recoveryCodes.map(hashRecoveryCode));
    
    // Enable MFA for user
    const result = await enableMfa(userId, secret, hashedCodes);
    
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to enable MFA' });
    }
    
    res.json({
      success: true,
      recoveryCodes: recoveryCodes // Return unhashed codes only once
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({ error: 'Failed to verify MFA setup' });
  }
});

/**
 * Verify MFA during login (step 2)
 */
router.post('/mfa/verify', mfaLimiter, async (req, res) => {
  try {
    const { userId, code, recoveryCode } = req.body;
    
    if (!userId || (!code && !recoveryCode)) {
      return res.status(400).json({ error: 'User ID and code or recovery code required' });
    }
    
    // Get MFA status from database
    const status = await checkMfaStatus(userId);
    
    if (!status.enabled || !status.secret) {
      return res.status(400).json({ error: 'MFA not enabled for this user' });
    }
    
    // Verify the code
    if (code) {
      const isValid = verifyMfaCode(status.secret, code);
      
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid MFA code' });
      }
      
      // MFA verified successfully
      return res.json({ success: true, verified: true });
    }
    
    // Verify recovery code
    // Note: In production, you'd want to invalidate used recovery codes
    const isValid = await verifyRecoveryCode(recoveryCode, status.recoveryCodes || []);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid recovery code' });
    }
    
    res.json({ success: true, verified: true, usedRecoveryCode: true });
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({ error: 'Failed to verify MFA' });
  }
});

/**
 * Disable MFA (requires password confirmation)
 */
router.post('/mfa/disable', jwtAuth, mfaLimiter, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required for security' });
    }
    
    const result = await disableMfa(userId, password);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ success: true, message: 'MFA disabled successfully' });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

/**
 * Get MFA status for current user
 */
router.get('/mfa/status', jwtAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const status = await checkMfaStatus(userId);
    
    res.json({
      enabled: status.enabled,
      verified: status.verified,
      hasRecoveryCodes: status.hasRecoveryCodes
    });
  } catch (error) {
    console.error('MFA status error:', error);
    res.status(500).json({ error: 'Failed to get MFA status' });
  }
});

// Helper function to enable MFA
async function enableMfa(userId, secret, recoveryCodesHashes) {
  try {
    const { default: pool } = await import('../config/db.js');
    
    await pool.query(
      `UPDATE users 
       SET mfa_enabled = 1, mfa_secret = ?, mfa_verified = 1, recovery_codes_hash = ?
       WHERE id = ?`,
      [secret, JSON.stringify(recoveryCodesHashes), userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Failed to enable MFA:', error);
    return { success: false, error: error.message };
  }
}

export default router;
