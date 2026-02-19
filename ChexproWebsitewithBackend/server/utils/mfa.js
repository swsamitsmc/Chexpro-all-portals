import { TOTP, Secret } from 'otpauth';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Encryption key for MFA secrets (should be 32 bytes for AES-256)
const getEncryptionKey = () => {
  const key = process.env.MFA_ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[MFA] MFA_ENCRYPTION_KEY environment variable is required in production. Set this to a secure random 32+ character string.');
    }
    console.warn('[MFA] MFA_ENCRYPTION_KEY not set, using development-only default. DO NOT use in production!');
    return crypto.createHash('sha256').update('chexpro-mfa-dev-only-not-for-production').digest();
  }
  // Ensure key is 32 bytes
  return crypto.createHash('sha256').update(key).digest();
};

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt MFA secret for secure storage
 */
export const encryptMfaSecret = (secret) => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return iv:authTag:encrypted (all hex encoded)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt MFA secret from storage
 */
export const decryptMfaSecret = (encryptedData) => {
  try {
    const key = getEncryptionKey();
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[MFA] Failed to decrypt MFA secret:', error.message);
    return null;
  }
};

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
 * Uses cryptographically secure random bytes
 */
export const generateRecoveryCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Use crypto.randomBytes for cryptographically secure random values
    const randomBytes = crypto.randomBytes(8).toString('hex').toUpperCase();
    // Format as XXXX-XXXX-XXXX for better readability
    const code = `${randomBytes.slice(0, 4)}-${randomBytes.slice(4, 8)}-${randomBytes.slice(8, 12)}`;
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
    
    const row = rows[0];
    
    // Decrypt the secret if it exists (for verification purposes)
    let secret = null;
    if (row.mfa_secret_hash) {
      secret = decryptMfaSecret(row.mfa_secret_hash);
    }
    
    // Parse recovery codes if they exist
    let recoveryCodes = [];
    if (row.recovery_codes_hash) {
      try {
        recoveryCodes = JSON.parse(row.recovery_codes_hash);
      } catch (e) {
        console.error('[MFA] Failed to parse recovery codes:', e.message);
      }
    }
    
    return {
      enabled: row.mfa_enabled === 1,
      verified: row.mfa_verified === 1,
      hasRecoveryCodes: !!row.recovery_codes_hash,
      secret: secret,
      recoveryCodes: recoveryCodes
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
    
    // Encrypt the MFA secret before storing (never store plaintext)
    const encryptedSecret = encryptMfaSecret(secret);
    
    await pool.query(
      `UPDATE users 
       SET mfa_enabled = 1, mfa_secret_hash = ?, mfa_verified = 1, recovery_codes_hash = ?
       WHERE id = ?`,
      [encryptedSecret, JSON.stringify(recoveryCodesHashes), userId]
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
      'UPDATE users SET mfa_enabled = 0, mfa_secret_hash = NULL, mfa_verified = 0, recovery_codes_hash = NULL WHERE id = ?',
      [userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Failed to disable MFA:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Invalidate a used recovery code
 * Removes the used code from the list of valid recovery codes
 */
export const invalidateRecoveryCode = async (userId, usedCode, existingCodes) => {
  try {
    const { default: pool } = await import('../config/db.js');
    
    // Hash the used code to find it in the list
    const usedCodeHash = await hashRecoveryCode(usedCode);
    
    // Filter out the used code
    const remainingCodes = (existingCodes || []).filter(code => code !== usedCodeHash);
    
    // Update the database with remaining codes
    await pool.query(
      'UPDATE users SET recovery_codes_hash = ? WHERE id = ?',
      [JSON.stringify(remainingCodes), userId]
    );
    
    return { success: true, remainingCount: remainingCodes.length };
  } catch (error) {
    console.error('Failed to invalidate recovery code:', error);
    return { success: false, error: error.message };
  }
};
