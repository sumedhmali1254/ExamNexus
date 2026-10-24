// =============================================
// Database Connection Module
// Uses mysql2 with promise support
// =============================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

// Create a connection pool for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'exam_seating_optimizer',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection on startup
pool.getConnection()
    .then(conn => {
        console.log('Connected to MySQL database:', process.env.DB_NAME);
        conn.release();
    })
    .catch(err => {
        console.error('MySQL CONNECTION ERROR:', err.code);
        console.error('Message:', err.message);
        console.log('\nPROBABLE CAUSES:');
        console.log('1. MySQL is not running');
        console.log('2. The database does not exist');
        console.log('3. The username or password in .env is incorrect');
        console.log('4. Check your database settings in .env\n');
    });

module.exports = pool;