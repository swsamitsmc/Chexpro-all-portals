// Email configuration utility for dynamic recipient management
import pool from '../config/db.js';

// Cache for email recipients to avoid frequent DB queries
let recipientCache = {
  contact: process.env.CONTACT_RECIPIENT,
  demo: process.env.DEMO_RECIPIENT,
  lastUpdated: Date.now()
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getEmailRecipient = async (type) => {
  // Return cached value if still valid
  if (Date.now() - recipientCache.lastUpdated < CACHE_DURATION) {
    return recipientCache[type];
  }

  try {
    // Try to get from database first
    const [rows] = await pool.query(
      'SELECT recipient_email FROM email_recipients WHERE type = ? AND active = 1 LIMIT 1',
      [type]
    );
    
    if (rows.length > 0) {
      recipientCache[type] = rows[0].recipient_email;
      recipientCache.lastUpdated = Date.now();
      return recipientCache[type];
    }
  } catch (error) {
    console.warn(`Failed to fetch ${type} recipient from database, using environment variable:`, error.message);
  }

  // Fallback to environment variables
  return type === 'contact' ? process.env.CONTACT_RECIPIENT : process.env.DEMO_RECIPIENT;
};

export const clearRecipientCache = () => {
  recipientCache.lastUpdated = 0;
};