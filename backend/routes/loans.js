// backend/routes/loans.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware: require login
function auth(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'Not logged in.' });
    next();
}
function adminAuth(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admins only.' });
    next();
}

// Get all loan types
router.get('/types', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM loan_types');
    res.json(rows);
});

// EMI calculation
router.post('/calculate-emi', (req, res) => {
    const { principal, rate, tenure } = req.body;
    const r = rate / 100 / 12;
    const emi = (principal * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1);
    res.json({ emi: parseFloat(emi.toFixed(2)), total: parseFloat((emi * tenure).toFixed(2)) });
});

// Apply for loan
router.post('/apply', auth, async (req, res) => {
    try {
        const { loan_type_id, amount, tenure_months, purpose } = req.body;
        const [typeRows] = await db.query('SELECT * FROM loan_types WHERE id = ?', [loan_type_id]);
        if (!typeRows.length) return res.status(400).json({ error: 'Invalid loan type.' });
        const type = typeRows[0];

        const r = type.interest_rate / 100 / 12;
        const emi = (amount * r * Math.pow(1 + r, tenure_months)) / (Math.pow(1 + r, tenure_months) - 1);

        const [result] = await db.query(
            'INSERT INTO loans (user_id, loan_type_id, amount, tenure_months, purpose, monthly_emi) VALUES (?,?,?,?,?,?)',
            [req.session.user.id, loan_type_id, amount, tenure_months, purpose, emi.toFixed(2)]
        );
        res.json({ success: true, loan_id: result.insertId, monthly_emi: emi.toFixed(2) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get my loans (customer)
router.get('/my', auth, async (req, res) => {
    const [rows] = await db.query(
        `SELECT l.*, lt.name as loan_type_name, lt.interest_rate 
         FROM loans l JOIN loan_types lt ON l.loan_type_id = lt.id 
         WHERE l.user_id = ? ORDER BY l.applied_at DESC`,
        [req.session.user.id]
    );
    res.json(rows);
});

// Get all loans (admin)
router.get('/all', adminAuth, async (req, res) => {
    const [rows] = await db.query(
        `SELECT l.*, lt.name as loan_type_name, u.full_name, u.email 
         FROM loans l 
         JOIN loan_types lt ON l.loan_type_id = lt.id 
         JOIN users u ON l.user_id = u.id 
         ORDER BY l.applied_at DESC`
    );
    res.json(rows);
});

// Update loan status (admin)
router.put('/:id/status', adminAuth, async (req, res) => {
    const { status } = req.body;
    await db.query('UPDATE loans SET status = ? WHERE id = ?', [status, req.params.id]);
    
    // If approved/disbursed, generate EMI schedule
    if (status === 'disbursed') {
        const [loans] = await db.query('SELECT * FROM loans WHERE id = ?', [req.params.id]);
        const loan = loans[0];
        const today = new Date();
        const payments = [];
        for (let i = 1; i <= loan.tenure_months; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() + i, today.getDate());
            payments.push([loan.id, loan.monthly_emi, d.toISOString().split('T')[0], 'pending']);
        }
        await db.query('DELETE FROM payments WHERE loan_id = ?', [loan.id]);
        if (payments.length) await db.query('INSERT INTO payments (loan_id, amount, payment_date, status) VALUES ?', [payments]);
    }
    res.json({ success: true });
});

// Get payment schedule
router.get('/:id/payments', auth, async (req, res) => {
    const [rows] = await db.query('SELECT * FROM payments WHERE loan_id = ? ORDER BY payment_date', [req.params.id]);
    res.json(rows);
});

// Mark payment as paid
router.put('/payments/:id/pay', adminAuth, async (req, res) => {
    await db.query('UPDATE payments SET status = "paid" WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

// Get all customers (admin)
router.get('/customers', adminAuth, async (req, res) => {
    const [rows] = await db.query('SELECT id, full_name, email, phone, address, created_at FROM users WHERE role = "customer"');
    res.json(rows);
});

// Add loan type (admin)
router.post('/types', adminAuth, async (req, res) => {
    const { name, interest_rate, max_amount, max_tenure_months, description } = req.body;
    await db.query('INSERT INTO loan_types (name, interest_rate, max_amount, max_tenure_months, description) VALUES (?,?,?,?,?)',
        [name, interest_rate, max_amount, max_tenure_months, description]);
    res.json({ success: true });
});

// Dashboard stats (admin)
router.get('/stats', adminAuth, async (req, res) => {
    const [[{ total_loans }]] = await db.query('SELECT COUNT(*) as total_loans FROM loans');
    const [[{ pending }]] = await db.query('SELECT COUNT(*) as pending FROM loans WHERE status="pending"');
    const [[{ approved }]] = await db.query('SELECT COUNT(*) as approved FROM loans WHERE status="approved" OR status="disbursed"');
    const [[{ customers }]] = await db.query('SELECT COUNT(*) as customers FROM users WHERE role="customer"');
    const [[{ total_amount }]] = await db.query('SELECT IFNULL(SUM(amount),0) as total_amount FROM loans WHERE status="disbursed"');
    res.json({ total_loans, pending, approved, customers, total_amount });
});

module.exports = router;
