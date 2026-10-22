// =============================================
// Auth Routes
// Simple authentication for admin
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db');

// -----------------------------------------
// POST /signup - Create admin account
// -----------------------------------------
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        // Check if user exists
        const [existing] = await db.query('SELECT * FROM teachers WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // For this simple version, we store in the teachers table or a new admin table
        // Let's create an admins table if not exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(100) UNIQUE,
                password VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(
            'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
            [name, email, password]
        );

        res.json({ success: true, message: 'Account created successfully' });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ success: false, message: 'Signup failed' });
    }
});

// -----------------------------------------
// POST /login - Admin login
// -----------------------------------------
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM admins WHERE email = ? AND password = ?', [email, password]);
        
        if (users.length > 0) {
            res.json({ 
                success: true, 
                message: 'Login successful',
                user: { name: users[0].name, email: users[0].email }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

module.exports = router;
