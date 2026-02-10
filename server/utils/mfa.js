import { TOTP, Secret } from 'otpauth';
import QRCode from 'qrcode';

/**
 * TOTP (Time-based One-Time Password) MFA Utilities
 * Uses industry-standard TOTP algorithm compatible with Google Authenticator, Authy, etc.
 */

/**
 * Generate a new TOTP secret for a user
 */
export const generateMfaSecret = () => {
  const secret = new Secret();
  return secret.base32;
};

/**
 * Generate a QR code for setting up MFA in authenticator apps
 */
export const generateMfaQrCode = async (issuer, accountName, secret) => {
  const totp = new TOTP({
    issuer: issuer || 'ChexPro',
    label: accountName,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret
  });

  const otpauthUrl = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256
  });

  return {
    qrCode: qrCodeDataUrl,
    secret: secret,
    otpauthUrl: otpauthUrl
  };
};

/**
 * Verify a TOTP code entered by the user
 */
export const verifyMfaCode = (secret, code) => {
  const totp = new TOTP({
    issuer: 'ChexPro',
    label: 'User',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret
  });

  const delta = totp.validate({
    token: code,
    window: 1 // Allow 1 step tolerance (30 seconds before/after)
  });

  return delta !== null;
};

/**
 * Generate recovery codes for account recovery
 */
export const generateRecoveryCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase() + 
                 Math.random().toString(36).substring(2, 8).toUpperCase();
    codes.push(code);
  }
  return codes;
};

/**
 * Hash a recovery code for secure storage
 */
export const hashRecoveryCode = async (code) => {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
};

/**
 * Verify a recovery code against stored hashed codes
 */
export const verifyRecoveryCode = async (inputCode, hashedCodes) => {
  const crypto = await import('crypto');
  const inputHash = crypto.createHash('sha256').update(inputCode.toUpperCase()).digest('hex');
  
  return hashedCodes.includes(inputHash);
};

/**
 * Check if MFA is enabled for a user (from database)
 */
export const checkMfaStatus = async (userId) => {
  try {
    const { default: pool } = await import('../config/db.js');
    const [rows] = await pool.query(
      'SELECT mfa_enabled, mfa_secret_hash, mfa_verified, recovery_codes_hash FROM users WHERE id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return { enabled: false };
    }
    
    return {
      enabled: rows[0].mfa_enabled === 1,
      verified: rows[0].mfa_verified === 1,
      hasRecoveryCodes: !!rows[0].recovery_codes_hash
    };
  } catch (error) {
    console.error('Failed to check MFA status:', error);
    return { enabled: false, error: error.message };
  }
};

/**
 * Enable MFA for a user
 */
export const enableMfa = async (userId, secret, recoveryCodesHashes) => {
  try {
    const { default: pool } = await import('../config/db.js');
    
    await pool.query(
      `UPDATE users 
       SET m_enabled = 1, mfa_secret = ?, mfa_verified = 1, recovery_codes_hash = ?
       WHERE id = ?`,
      [secret, JSON.stringify(recoveryCodesHashes), userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Failed to enable MFA:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Disable MFA for a user (requires password confirmation)
 */
export const disableMfa = async (userId, password) => {
  try {
    const bcrypt = await import('bcrypt');
    const { default: pool } = await import('../config/db.js');
    
    // Verify password first
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return { success: false, error: 'User not found' };
    }
    
    const passwordMatch = await bcrypt.compare(password, rows[0].password_hash);
    if (!passwordMatch) {
      return { success: false, error: 'Invalid password' };
    }
    
    // Disable MFA
    await pool.query(
      'UPDATE users SET mfa_enabled = 0, mfa_secret = NULL, mfa_verified = 0, recovery_codes_hash = NULL WHERE id = ?',
      [userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Failed to disable MFA:', error);
    return { success: false, error: error.message };
  }
};
