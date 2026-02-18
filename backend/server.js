// backend/server.js
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(session({
    secret: 'eloan_secret_2025',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Serve static files (HTML/CSS/JS frontend)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/loans', require('./routes/loans'));

// Serve index.html for any other route (SPA fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n✅ eLoan Server running at http://localhost:${PORT}`);
    console.log(`   Open your browser and visit: http://localhost:${PORT}\n`);
});
