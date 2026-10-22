const express = require('express');
const router = express.Router();
const db = require('../db');

// --- Middleware for logging ---
router.use((req, res, next) => {
    console.log(`[SETTINGS API] ${req.method} ${req.url}`);
    next();
});

router.get('/', (req, res) => {
    res.json({ success: true, message: 'Settings API is alive' });
});

// --- Domains ---
router.get('/domains', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM domains');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/domains', async (req, res) => {
    const { name } = req.body;
    try {
        const [result] = await db.query('INSERT INTO domains (name) VALUES (?)', [name]);
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/domains/:id', async (req, res) => {
    const { name } = req.body;
    try {
        await db.query('UPDATE domains SET name = ? WHERE id = ?', [name, req.params.id]);
        res.json({ success: true, message: 'Domain updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/domains/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM domains WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Domain deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- Programs ---
router.get('/programs', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT p.*, d.name as domain_name FROM programs p JOIN domains d ON p.domain_id = d.id');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/programs', async (req, res) => {
    const { domain_id, name, duration_years } = req.body;
    try {
        const [result] = await db.query('INSERT INTO programs (domain_id, name, duration_years) VALUES (?, ?, ?)', [domain_id, name, duration_years]);
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/programs/:id', async (req, res) => {
    const { name, duration_years } = req.body;
    try {
        await db.query('UPDATE programs SET name = ?, duration_years = ? WHERE id = ?', [name, duration_years, req.params.id]);
        res.json({ success: true, message: 'Program updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/programs/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM programs WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Program deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- Departments ---
router.get('/departments', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT dept.*, p.name as program_name FROM departments dept JOIN programs p ON dept.program_id = p.id');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/departments', async (req, res) => {
    const { program_id, name } = req.body;
    try {
        const [result] = await db.query('INSERT INTO departments (program_id, name) VALUES (?, ?)', [program_id, name]);
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/departments/:id', async (req, res) => {
    const { name } = req.body;
    try {
        await db.query('UPDATE departments SET name = ? WHERE id = ?', [name, req.params.id]);
        res.json({ success: true, message: 'Department updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/departments/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Department deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- Exams ---
router.get('/exams', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.id, e.name, e.duration_mins, e.total_marks, e.domain_id, d.name as domain_name 
            FROM exam_types e 
            JOIN domains d ON e.domain_id = d.id
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Fetch Exams Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/exams', async (req, res) => {
    const { domain_id, name, total_marks, duration_mins } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO exam_types (domain_id, name, total_marks, duration_mins) VALUES (?, ?, ?, ?)', 
            [domain_id, name, total_marks, duration_mins]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/exams/:id', async (req, res) => {
    const { name, total_marks, duration_mins } = req.body;
    try {
        await db.query(
            'UPDATE exam_types SET name = ?, total_marks = ?, duration_mins = ? WHERE id = ?', 
            [name, total_marks, duration_mins, req.params.id]
        );
        res.json({ success: true, message: 'Exam pattern updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/exams/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM exam_types WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Exam deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

