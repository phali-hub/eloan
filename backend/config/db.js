// backend/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',          // Change to your MySQL username
    password: '901017273',          // Change to your MySQL password
    database: 'eloan_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
