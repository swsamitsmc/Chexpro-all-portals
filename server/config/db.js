const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool. This is more efficient than creating a new connection for every query.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// This line was added to help debug connection issues if they arise.
pool.getConnection()
    .then(conn => {
        console.log('MySQL Connection Pool Created and tested successfully.');
        conn.release(); // release the connection back to the pool
    })
    .catch(err => {
        console.error('[FATAL] Could not create MySQL connection pool.', err);
    });


module.exports = pool;