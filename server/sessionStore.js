import pool from './config/db.js';

export const saveSession = async (sessionId, userId, expirationTime) => {
    // In a real application, you would store more user-specific data
    const query = 'INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)';
    await pool.query(query, [sessionId, userId, expirationTime]);
};

export const getSession = async (sessionId) => {
    const query = 'SELECT * FROM sessions WHERE session_id = ? AND expires_at > NOW()';
    const [rows] = await pool.query(query, [sessionId]);
    return rows[0];
};

export const deleteSession = async (sessionId) => {
    const query = 'DELETE FROM sessions WHERE session_id = ?';
    await pool.query(query, [sessionId]);
};
