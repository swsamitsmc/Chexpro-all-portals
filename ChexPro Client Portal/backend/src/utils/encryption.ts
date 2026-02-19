import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;

/**
 * Derive a 256-bit key from the encryption key using PBKDF2
 */
function getDerivedKey(encryptionKey: string): Buffer {
  // Use a fixed salt for deterministic encryption (salt is stored with the ciphertext)
  // In production, you might want to use a unique salt per encryption
  const salt = Buffer.from('chexpro-sin-encryption-salt', 'utf8');
  return crypto.pbkdf2Sync(encryptionKey, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt a sensitive field (like SIN) using AES-256-CBC
 * Returns format: "iv:encryptedData" (both hex encoded)
 */
export function encryptField(plaintext: string): string {
  if (!plaintext) return '';

  const key = getDerivedKey(env.encryptionKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Prepend IV to encrypted data for decryption
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a sensitive field (like SIN)
 * Input format: "iv:encryptedData" (both hex encoded)
 */
export function decryptField(encryptedData: string): string {
  if (!encryptedData) return '';

  // Check if it's in the expected format
  if (!encryptedData.includes(':')) {
    // Handle legacy format or plain text
    return encryptedData;
  }

  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = getDerivedKey(env.encryptionKey);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hash an API key for storage (one-way)
 * Uses SHA-256 with salt
 */
export function hashApiKey(apiKey: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(apiKey, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verify an API key against a stored hash
 */
export function verifyApiKey(apiKey: string, storedHash: string, salt: string): boolean {
  const hash = crypto.pbkdf2Sync(apiKey, salt, 100000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

/**
 * Generate a secure random API key
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Mask an API key for display (show only last 4 chars)
 */
export function maskApiKey(fullKey: string): string {
  if (!fullKey || fullKey.length < 4) return '****';
  return '*'.repeat(fullKey.length - 4) + fullKey.slice(-4);
}
