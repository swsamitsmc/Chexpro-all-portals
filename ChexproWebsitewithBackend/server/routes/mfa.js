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
  verifyRecoveryCode,
  disableMfa,
  checkMfaStatus,
  enableMfa,
  invalidateRecoveryCode
} from '../utils/mfa.js';

const router = express.Router();

// Rate limiting for MFA endpoints
const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});

// Stricter rate limiting for MFA verification (prevent brute force)
const mfaVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 verification attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts, please try again later' }
});

// Per-user rate limiter for MFA verification (prevents brute force from same user)
// Note: This limiter requires userId in request body to function properly
const mfaUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per user per window
  standardHeaders: true,
  legacyHeaders: false,
  // Use userId from body, prefixed to distinguish from IP addresses
  // If no userId, the request will be validated by mfaVerifyLimiter (IP-based)
  keyGenerator: (req) => `mfa-user-${req.body.userId || 'anonymous'}`,
  skip: (req) => !req.body.userId, // Skip if no userId - IP limiter will handle it
  message: { error: 'Too many MFA attempts for this account. Please try again later.' }
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
    
    // Enable MFA for user (using utility function with encryption)
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
router.post('/mfa/verify', mfaVerifyLimiter, mfaUserLimiter, async (req, res) => {
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
    const isValid = await verifyRecoveryCode(recoveryCode, status.recoveryCodes || []);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid recovery code' });
    }
    
    // Invalidate the used recovery code
    await invalidateRecoveryCode(userId, recoveryCode, status.recoveryCodes);
    
    res.json({ 
      success: true, 
      verified: true, 
      usedRecoveryCode: true,
      remainingCodes: (status.recoveryCodes?.length || 1) - 1
    });
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

export default router;