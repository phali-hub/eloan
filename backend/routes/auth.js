// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Register
router.post('/register', async (req, res) => {
    try {
        const { full_name, email, phone, address, password } = req.body;
        if (!full_name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(409).json({ error: 'Email already registered.' });

        const hash = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (full_name, email, phone, address, password_hash) VALUES (?,?,?,?,?)',
            [full_name, email, phone, address, hash]
        );
        res.json({ success: true, message: 'Registration successful. Please login.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or password.' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

        req.session.user = { id: user.id, full_name: user.full_name, email: user.email, role: user.role };
        res.json({ success: true, user: req.session.user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Get current session
router.get('/me', (req, res) => {
    if (req.session.user) res.json({ user: req.session.user });
    else res.status(401).json({ error: 'Not logged in.' });
});

// Change password
router.post('/change-password', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not logged in.' });
    try {
        const { old_password, new_password } = req.body;
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
        const user = rows[0];
        const match = await bcrypt.compare(old_password, user.password_hash);
        if (!match) return res.status(400).json({ error: 'Current password is incorrect.' });
        const hash = await bcrypt.hash(new_password, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
