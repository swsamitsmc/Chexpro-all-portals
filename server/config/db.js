import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

// Create a connection pool. This is more efficient than creating a new connection for every query.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '50', 10)
});

// Initialize and test database connection
export const initializeDatabase = async () => {
    try {
        const conn = await pool.getConnection();
        console.log('MySQL Connection Pool Created and tested successfully.');
        conn.release();
        return true;
    } catch (err) {
        const sanitizedMessage = (err.message || 'Unknown error').replace(/[\r\n]/g, ' ');
        console.error('[FATAL] Could not create MySQL connection pool.', sanitizedMessage);
        return false;
    }
};

// Graceful shutdown handler - close database connections when process terminates
const gracefulShutdown = async () => {
    console.log('Received shutdown signal. Closing database connections...');
    try {
        await pool.end();
        console.log('Database connections closed gracefully.');
        process.exit(0);
    } catch (error) {
        console.error('Error closing database connections:', error);
        process.exit(1);
    }
};

// Register graceful shutdown handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default pool;