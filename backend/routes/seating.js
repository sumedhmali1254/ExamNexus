// =============================================
// Seating Routes
// Generate seating & teacher allocation by
// calling C programs via child_process
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const nativeEngine = require('../engine/nativeEngine');

// Path to compiled C executables
const SEATING_EXE = path.join(__dirname, '..', 'c_algos', 'seating.exe');
const TEACHER_EXE = path.join(__dirname, '..', 'c_algos', 'teacher_allocation.exe');

// -----------------------------------------
// POST /generate-seating
// Generates seating plan using C algorithm
// -----------------------------------------
router.post('/generate-seating', async (req, res) => {
    const { session_name, students_per_bench, allow_same_branch, allow_same_year } = req.body;

    if (!session_name) {
        return res.status(400).json({ success: false, message: 'Session name is required' });
    }

    try {
        // Fetch students and rooms from database
        const [students] = await db.query('SELECT * FROM students ORDER BY branch, year, roll_number');
        const [rooms] = await db.query('SELECT * FROM rooms ORDER BY room_number');

        if (students.length === 0) {
            return res.status(400).json({ success: false, message: 'No students found. Add students first.' });
        }
        if (rooms.length === 0) {
            return res.status(400).json({ success: false, message: 'No rooms found. Add rooms first.' });
        }

        // Prepare input for C program
        const input = JSON.stringify({
            students: students.map(s => ({
                name: s.name,
                roll: s.roll_number,
                branch: s.branch,
                year: s.year
            })),
            rooms: rooms.map(r => ({
                room_number: r.room_number,
                rows: r.num_rows,
                cols: r.num_columns
            })),
            rules: {
                students_per_bench: students_per_bench || 1,
                allow_same_branch: allow_same_branch ? 1 : 0,
                allow_same_year: allow_same_year ? 1 : 0
            }
        });

        // Call the C program (with native fallback)
        let result;
        try {
            if (!fs.existsSync(SEATING_EXE)) {
                throw new Error('Seating algorithm binary not found.');
            }
            result = await new Promise((resolve, reject) => {
                const child = execFile(SEATING_EXE, [], { timeout: 30000 }, (error, stdout, stderr) => {
                    if (error) {
                        return reject(new Error('Seating algorithm failed: ' + (stderr || error.message)));
                    }
                    try {
                        resolve(JSON.parse(stdout));
                    } catch (parseErr) {
                        reject(new Error('Failed to parse algorithm output'));
                    }
                });
                child.stdin.write(input);
                child.stdin.end();
            });
        } catch (cErr) {
            console.warn(`[Engine Info] C Seating binary unavailable (${cErr.message}). Using native JS engine.`);
            result = nativeEngine.simpleSeatingGenerator({
                students: students.map(s => ({
                    name: s.name,
                    roll: s.roll_number,
                    branch: s.branch,
                    year: s.year
                })),
                rooms: rooms.map(r => ({
                    room_number: r.room_number,
                    rows: r.num_rows,
                    cols: r.num_columns
                })),
                rules: {
                    students_per_bench: students_per_bench || 1,
                    allow_same_branch: allow_same_branch ? 1 : 0,
                    allow_same_year: allow_same_year ? 1 : 0
                }
            });
        }

        // Clear previous seating for this session
        await db.query('DELETE FROM seating WHERE session_name = ?', [session_name]);

        // Save seating results to database
        if (result.seating && result.seating.length > 0) {
            const values = result.seating.map(s => [
                session_name, s.room_number, s.bench_number, 
                s.seat_position, s.student_name, s.roll_number, s.branch
            ]);
            await db.query(
                `INSERT INTO seating (session_name, room_number, bench_number, seat_position, student_name, roll_number, branch) 
                 VALUES ?`,
                [values]
            );
        }

        res.json({ 
            success: true, 
            message: 'Seating generated successfully using C algorithm', 
            data: result.seating,
            stats: result.stats
        });
    } catch (err) {
        console.error('Seating generation error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// -----------------------------------------
// GET /seating - Get saved seating plan
// -----------------------------------------
router.get('/seating', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM seating ORDER BY session_name DESC, room_number, bench_number, seat_position'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching seating:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch seating' });
    }
});

// -----------------------------------------
// POST /allocate-teachers
// Assigns teachers to rooms using C algorithm
// -----------------------------------------
router.post('/allocate-teachers', async (req, res) => {
    const { session_name } = req.body;

    if (!session_name) {
        return res.status(400).json({ success: false, message: 'Session name is required' });
    }

    try {
        const [teachers] = await db.query('SELECT * FROM teachers ORDER BY department, name');
        const [rooms] = await db.query('SELECT * FROM rooms ORDER BY room_number');

        if (teachers.length === 0) {
            return res.status(400).json({ success: false, message: 'No teachers found.' });
        }
        if (rooms.length === 0) {
            return res.status(400).json({ success: false, message: 'No rooms found.' });
        }

        // Prepare input for C program
        const input = JSON.stringify({
            teachers: teachers.map(t => ({
                name: t.name,
                department: t.department
            })),
            rooms: rooms.map(r => ({
                room_number: r.room_number
            }))
        });

        // Call the C program (with native fallback)
        let result;
        try {
            if (!fs.existsSync(TEACHER_EXE)) {
                throw new Error('Teacher allocation binary not found.');
            }
            result = await new Promise((resolve, reject) => {
                const child = execFile(TEACHER_EXE, [], { timeout: 30000 }, (error, stdout, stderr) => {
                    if (error) {
                        return reject(new Error('Teacher allocation failed: ' + (stderr || error.message)));
                    }
                    try {
                        resolve(JSON.parse(stdout));
                    } catch (parseErr) {
                        reject(new Error('Failed to parse algorithm output'));
                    }
                });
                child.stdin.write(input);
                child.stdin.end();
            });
        } catch (cErr) {
            console.warn(`[Engine Info] C Teacher allocation binary unavailable (${cErr.message}). Using native JS engine.`);
            result = nativeEngine.allocateTeachers({
                teachers: teachers.map(t => ({
                    name: t.name,
                    department: t.department
                })),
                rooms: rooms.map(r => ({
                    room_number: r.room_number
                }))
            });
        }

        // Clear previous allocation for this session
        await db.query('DELETE FROM teacher_allocation WHERE session_name = ?', [session_name]);

        // Save allocation results
        if (result.allocation && result.allocation.length > 0) {
            const values = result.allocation.map(a => [
                session_name, a.room_number, a.teacher_name, a.department
            ]);
            await db.query(
                `INSERT INTO teacher_allocation (session_name, room_number, teacher_name, department) 
                 VALUES ?`,
                [values]
            );
        }

        res.json({ 
            success: true, 
            message: 'Teachers allocated successfully using C algorithm', 
            data: result.allocation 
        });
    } catch (err) {
        console.error('Teacher allocation error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/teacher-allocation', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM teacher_allocation ORDER BY session_name DESC, room_number'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching teacher allocation:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch allocations' });
    }
});

module.exports = router;
