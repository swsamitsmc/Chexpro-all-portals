import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../config/db.js';

export const createUser = async (username, email, password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();
    
    await pool.query(
      'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
      [userId, username, email, passwordHash]
    );
    
    return { id: userId, username, email };
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
  }
};

export const validatePersistentToken = async (token) => {
  try {
    const [rows] = await pool.query(
      'SELECT pt.user_id, u.username FROM persistent_tokens pt JOIN users u ON pt.user_id = u.id WHERE pt.expires_at > NOW() AND u.active = 1',
      []
    );
    
    for (const row of rows) {
      const isValid = await bcrypt.compare(token, row.token_hash);
      if (isValid) {
        return { id: row.user_id, username: row.username };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to validate persistent token:', error);
    return null;
  }
};

export const cleanupExpiredTokens = async () => {
  try {
    await pool.query('DELETE FROM persistent_tokens WHERE expires_at < NOW()');
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error);
  }
};