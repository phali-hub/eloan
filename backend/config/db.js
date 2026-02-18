// backend/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '901017273',
    database: process.env.MYSQLDATABASE || 'eloan_db',
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
});

module.exports = pool;
