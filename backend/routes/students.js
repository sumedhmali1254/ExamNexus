// =============================================
// Students Routes
// CRUD operations for student management
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const { spawn } = require('child_process');
const path = require('path');
const nativeEngine = require('../engine/nativeEngine');

const SEARCH_EXE = path.join(__dirname, '..', 'c_algos', 'search.exe');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM students ORDER BY branch, year, roll_number');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ success: false, message: 'Database Error: ' + err.message });
    }
});

router.post('/', async (req, res) => {
    const { name, roll_number, branch, year, division, domain, program } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO students (name, roll_number, branch, year, division, domain, program) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, roll_number, branch, parseInt(year), division || 'A', domain, program]
        );
        res.json({ success: true, message: 'Student added successfully', id: result.insertId });
    } catch (err) {
        console.error('Add student error:', err);
        res.status(500).json({ success: false, message: 'Failed to add student' });
    }
});

// -----------------------------------------
// POST /students/search - KMP search engine
// -----------------------------------------
router.post('/search', async (req, res) => {
    const { query, program, division } = req.body;
    
    try {
        const [rows] = await db.query('SELECT * FROM students');
        
        let filteredData;
        try {
            filteredData = await new Promise((resolve, reject) => {
                const child = spawn(SEARCH_EXE, [query || 'All', program || 'All', division || 'All']);
                let output = '';
                let errOut = '';
                child.stdout.on('data', (d) => { output += d.toString(); });
                child.stderr.on('data', (d) => { errOut += d.toString(); });
                child.on('error', (err) => reject(err));
                child.on('close', (code) => {
                    if (code !== 0) return reject(new Error(`Exit code ${code}: ${errOut}`));
                    try {
                        resolve(JSON.parse(output));
                    } catch (e) {
                        reject(e);
                    }
                });
                child.stdin.write(JSON.stringify(rows));
                child.stdin.end();
            });
        } catch (cErr) {
            filteredData = nativeEngine.filterWithKMP(rows, query, program, division);
        }

        res.json({ success: true, data: filteredData });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Search Error: ' + err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { name, roll_number, branch, year, division, domain, program } = req.body;
    console.log('Updating student:', req.params.id, { name, roll_number, branch, year, division, domain, program });
    try {
        await db.query(
            'UPDATE students SET name = ?, roll_number = ?, branch = ?, year = ?, division = ?, domain = ?, program = ? WHERE id = ?',
            [name, roll_number, branch, year, division, domain, program, req.params.id]
        );
        res.json({ success: true, message: 'Student updated' });
    } catch (err) {
        console.error('Update student error:', err);
        res.status(500).json({ success: false, message: 'Update failed' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM students WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Student deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Delete failed' });
    }
});

module.exports = router;
