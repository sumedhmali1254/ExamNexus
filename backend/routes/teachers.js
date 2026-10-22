// =============================================
// Teachers Routes
// CRUD operations for teacher management
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
        const [rows] = await db.query('SELECT * FROM teachers ORDER BY department, name');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching teachers:', err);
        res.status(500).json({ success: false, message: 'Database Error: ' + err.message });
    }
});

router.post('/', async (req, res) => {
    const { name, department, domain } = req.body;
    if (!name || !department) {
        return res.status(400).json({ success: false, message: 'Fields required' });
    }
    try {
        const [result] = await db.query('INSERT INTO teachers (name, department, domain) VALUES (?, ?, ?)', [name, department, domain]);
        res.json({ success: true, message: 'Teacher added', id: result.insertId });
    } catch (err) {
        console.error('Add teacher error:', err);
        res.status(500).json({ success: false, message: 'Database Error' });
    }
});

// -----------------------------------------
// POST /teachers/search - KMP search engine
// -----------------------------------------
router.post('/search', async (req, res) => {
    const { query, department } = req.body;
    
    try {
        const [rows] = await db.query('SELECT * FROM teachers');
        
        let filteredData;
        try {
            filteredData = await new Promise((resolve, reject) => {
                const child = spawn(SEARCH_EXE, [query || 'All', department || 'All', 'All']);
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
            filteredData = nativeEngine.filterWithKMP(rows, query, department, 'All');
        }

        res.json({ success: true, data: filteredData });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Search Error: ' + err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { name, department, domain } = req.body;
    console.log('Updating teacher:', req.params.id, { name, department, domain });
    try {
        await db.query('UPDATE teachers SET name = ?, department = ?, domain = ? WHERE id = ?', [name, department, domain, req.params.id]);
        res.json({ success: true, message: 'Teacher updated' });
    } catch (err) {
        console.error('Update teacher error:', err);
        res.status(500).json({ success: false, message: 'Update failed' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM teachers WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Teacher deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Delete failed' });
    }
});

module.exports = router;
