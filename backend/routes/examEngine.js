// =============================================
// Exam Engine Routes
// Handles seating generation and preview
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const { spawn } = require('child_process');
const path = require('path');
const nativeEngine = require('../engine/nativeEngine');

const SORTING_EXE = path.join(__dirname, '..', 'c_algos', 'student_sorting.exe');
const SEATING_EXE = path.join(__dirname, '..', 'c_algos', 'seating_generator.exe');
const TEACHER_EXE = path.join(__dirname, '..', 'c_algos', 'teacher_allocation.exe');

let cEngineBlockedByPolicy = false;

// Helper: Run a C executable with stdin data (with automatic policy block detection)
function runCEngine(exePath, inputData) {
    if (cEngineBlockedByPolicy) {
        return Promise.reject(new Error("C Engine is blocked by Windows Device Guard / WDAC policy; using native JavaScript engine."));
    }
    return new Promise((resolve, reject) => {
        // Check if exe exists before spawning
        const fs = require('fs');
        if (!fs.existsSync(exePath)) {
            return reject(new Error(`C Engine binary not found at: ${exePath}`));
        }
        
        const child = spawn(exePath, [], { 
            timeout: 30000,
            windowsHide: true,
            shell: true,
            cwd: path.dirname(exePath)
        });
        let output = '';
        let errorOut = '';
        
        child.on('error', (err) => {
            if (err.message && (err.message.includes('Device Guard') || err.message.includes('blocked'))) {
                cEngineBlockedByPolicy = true;
            }
            reject(new Error(`Failed to start C Engine: ${err.message}`));
        });
        
        child.stdout.on('data', (data) => { output += data.toString(); });
        child.stderr.on('data', (data) => { errorOut += data.toString(); });
        child.on('close', (code) => {
            if (code !== 0) {
                if (code === 4551 || (errorOut && (errorOut.includes('Device Guard') || errorOut.includes('blocked') || errorOut.includes('Application Control')))) {
                    cEngineBlockedByPolicy = true;
                }
                reject(new Error(`C Engine exited with code ${code}: ${errorOut}`));
            } else {
                resolve(output);
            }
        });
        child.stdin.write(inputData);
        child.stdin.end();
    });
}

// POST /exam-engine/check-capacity
router.post('/check-capacity', async (req, res) => {
    const { selectedStudentCount, selectedRoomIds, candidatesPerBench, roomSelectionMode } = req.body;
    try {
        let totalSelectedCapacity = 0;
        let isEnough = false;
        let shortage = 0;

        if (roomSelectionMode === 'custom' && selectedRoomIds && selectedRoomIds.length > 0) {
            const placeholders = selectedRoomIds.map(() => '?').join(',');
            const [rooms] = await db.query(`SELECT num_rows, num_columns FROM rooms WHERE id IN (${placeholders})`, selectedRoomIds);
            
            rooms.forEach(r => {
                totalSelectedCapacity += (r.num_rows * r.num_columns * (candidatesPerBench || 1));
            });
            
            isEnough = totalSelectedCapacity >= selectedStudentCount;
            shortage = isEnough ? 0 : (selectedStudentCount - totalSelectedCapacity);
        }

        res.json({
            success: true,
            data: {
                requiredCapacity: selectedStudentCount,
                totalSelectedCapacity,
                shortage,
                isEnough
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /exam-engine/auto-select-rooms
router.post('/auto-select-rooms', async (req, res) => {
    const { selectedStudentCount, candidatesPerBench } = req.body;
    try {
        const [rooms] = await db.query('SELECT *, (num_rows * num_columns) as total_benches FROM rooms ORDER BY total_benches DESC');
        
        let selectedRooms = [];
        let totalCapacity = 0;
        let cpb = candidatesPerBench || 1;

        for (const room of rooms) {
            if (totalCapacity >= selectedStudentCount) break;
            selectedRooms.push(room);
            totalCapacity += (room.total_benches * cpb);
        }

        res.json({
            success: true,
            data: {
                selectedRooms,
                totalCapacity,
                remainingSeats: totalCapacity - selectedStudentCount,
                status: totalCapacity >= selectedStudentCount ? 'success' : 'shortage'
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /exam-engine/generate-seating - Advanced Generate seating plan
router.post('/generate-seating', async (req, res) => {
    const { domain_id, departments, years, exam_pattern_id, exam_date, start_time, end_time, seating_rules, room_selection_mode, selected_room_ids } = req.body;
    try {
        try { await db.query('ALTER TABLE exam_sessions ADD COLUMN applied_rules JSON'); } catch (e) {}

        // 1. Create exam session
        const [sessionResult] = await db.query(
            'INSERT INTO exam_sessions (session_name, domain_id, exam_pattern_id, exam_date, start_time, end_time, status, applied_rules) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [`Session ${exam_date} ${start_time}`, domain_id || null, exam_pattern_id || null, exam_date, start_time, end_time, 'generating', JSON.stringify(seating_rules || {})]
        );
        const sessionId = sessionResult.insertId;

        // 2. Fetch students based on filters
        let studentQuery = 'SELECT * FROM students WHERE 1=1';
        const params = [];

        if (departments && departments.length > 0) {
            const first = departments[0];
            const isIdList = typeof first === 'number' || (!isNaN(Number(first)) && String(Number(first)) === String(first).trim());

            if (isIdList) {
                const numIds = departments.map(id => Number(id));
                const [deptRows] = await db.query(
                    `SELECT d.id, d.name as branch_name, p.name as prog_name 
                     FROM departments d 
                     LEFT JOIN programs p ON d.program_id = p.id 
                     WHERE d.id IN (${numIds.map(() => '?').join(',')})`,
                    numIds
                );
                if (deptRows.length > 0) {
                    const conditions = deptRows.map(dr => {
                        if (dr.prog_name) {
                            return `(branch = ? AND (program = ? OR program IS NULL))`;
                        } else {
                            return `branch = ?`;
                        }
                    }).join(' OR ');

                    studentQuery += ` AND (${conditions})`;
                    deptRows.forEach(dr => {
                        params.push(dr.branch_name);
                        if (dr.prog_name) {
                            params.push(dr.prog_name);
                        }
                    });
                }
            } else {
                const placeholders = departments.map(() => '?').join(',');
                studentQuery += ` AND branch IN (${placeholders})`;
                params.push(...departments);
            }
        }
        if (years && years.length > 0) {
            const placeholders = years.map(() => '?').join(',');
            studentQuery += ` AND year IN (${placeholders})`;
            params.push(...years);
        }

        const [students] = await db.query(studentQuery, params);
        
        let roomsQuery = 'SELECT * FROM rooms';
        let roomParams = [];
        if (room_selection_mode === 'custom' && selected_room_ids && selected_room_ids.length > 0) {
            const placeholders = selected_room_ids.map(() => '?').join(',');
            roomsQuery += ` WHERE id IN (${placeholders})`;
            roomParams.push(...selected_room_ids);
        }
        roomsQuery += ' ORDER BY num_rows * num_columns DESC';
        const [rooms] = await db.query(roomsQuery, roomParams);
        
        const rules = seating_rules || {};

        if (students.length === 0) {
            await db.query('UPDATE exam_sessions SET status = ? WHERE id = ?', ['failed', sessionId]);
            return res.json({ success: false, message: 'No students found for the selected filters' });
        }
        if (rooms.length === 0) {
            await db.query('UPDATE exam_sessions SET status = ? WHERE id = ?', ['failed', sessionId]);
            return res.json({ success: false, message: 'No rooms configured' });
        }

        // 3. Sort students via C Merge Sort (with native fallback)
        let sortedStudents;
        try {
            const sortedOutput = await runCEngine(SORTING_EXE, JSON.stringify(students));
            sortedStudents = JSON.parse(sortedOutput);
        } catch (cErr) {
            console.warn(`[Engine Info] C Sorting Engine unavailable (${cErr.message}). Using native JS Merge Sort engine.`);
            sortedStudents = nativeEngine.studentSorting(students);
        }

        // 4. Run seating generator (with native fallback)
        let result;
        try {
            const seatingInput = JSON.stringify({
                students: sortedStudents,
                rooms: rooms,
                rules: rules
            });
            const seatingOutput = await runCEngine(SEATING_EXE, seatingInput);
            result = JSON.parse(seatingOutput);
        } catch (cErr) {
            console.warn(`[Engine Info] C Seating Engine unavailable (${cErr.message}). Using native JS Seating Engine.`);
            result = nativeEngine.generateSeating(sortedStudents, rooms, rules);
        }

        // 5. Store assignments in DB
        if (result.assignments && result.assignments.length > 0) {
            const values = result.assignments.map(a =>
                `(${sessionId}, ${a.room_id}, ${a.bench_number}, ${a.seat_position}, ${a.student_id})`
            ).join(',');
            await db.query(`INSERT INTO seating_assignments (session_id, room_id, bench_number, seat_position, student_id) VALUES ${values}`);
        }

        await db.query('UPDATE exam_sessions SET status = ? WHERE id = ?', ['completed', sessionId]);

        res.json({
            success: true,
            message: `Seated ${result.seated} of ${result.total} students`,
            sessionId,
            seated: result.seated,
            total: result.total,
            unseated: result.total - result.seated
        });

    } catch (err) {
        console.error('Generation Error:', err);
        res.status(500).json({ success: false, message: 'Generation failed: ' + err.message });
    }
});

// GET /exam-engine/preview/:sessionId - Get seating preview
router.get('/preview/:sessionId', async (req, res) => {
    try {
        const [assignments] = await db.query(`
            SELECT sa.*, s.name as student_name, s.roll_number, s.branch, s.year, s.division,
                   r.room_number, r.num_rows, r.num_columns
            FROM seating_assignments sa
            JOIN students s ON sa.student_id = s.id
            JOIN rooms r ON sa.room_id = r.id
            WHERE sa.session_id = ?
            ORDER BY r.room_number, sa.bench_number, sa.seat_position
        `, [req.params.sessionId]);

        const [session] = await db.query('SELECT * FROM exam_sessions WHERE id = ?', [req.params.sessionId]);

        res.json({ success: true, data: assignments, session: session[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /exam-engine/sessions - List all sessions
router.get('/sessions', async (req, res) => {
    try {
        const [sessions] = await db.query('SELECT * FROM exam_sessions ORDER BY created_at DESC');
        res.json({ success: true, data: sessions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /exam-engine/allocate-teachers - Teacher allocation
router.post('/allocate-teachers', async (req, res) => {
    const { session_id } = req.body;
    try {
        const [teachers] = await db.query('SELECT * FROM teachers');
        const [usedRooms] = await db.query(
            'SELECT DISTINCT room_id FROM seating_assignments WHERE session_id = ?', [session_id]
        );

        if (teachers.length === 0) {
            return res.json({ success: false, message: 'No teachers available' });
        }

        // Clear old allocations
        await db.query('DELETE FROM teacher_allocations WHERE session_id = ?', [session_id]);

        // Round-robin teacher allocation
        const allocations = [];
        for (let i = 0; i < usedRooms.length; i++) {
            const teacher = teachers[i % teachers.length];
            allocations.push(`(${session_id}, ${usedRooms[i].room_id}, ${teacher.id})`);
        }

        if (allocations.length > 0) {
            await db.query(`INSERT INTO teacher_allocations (session_id, room_id, teacher_id) VALUES ${allocations.join(',')}`);
        }

        res.json({ success: true, message: `Allocated ${allocations.length} teachers to rooms` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /exam-engine/teacher-allocation/:sessionId
router.get('/teacher-allocation/:sessionId', async (req, res) => {
    try {
        const [allocs] = await db.query(`
            SELECT ta.*, t.name as teacher_name, t.department,
                   r.room_number
            FROM teacher_allocations ta
            JOIN teachers t ON ta.teacher_id = t.id
            JOIN rooms r ON ta.room_id = r.id
            WHERE ta.session_id = ?
        `, [req.params.sessionId]);
        res.json({ success: true, data: allocs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /exam-engine/stats - System stats for dashboard summary
router.get('/stats', async (req, res) => {
    try {
        const [sRows] = await db.query('SELECT COUNT(*) as count FROM students');
        const [rRows] = await db.query('SELECT COUNT(*) as count, COALESCE(SUM(num_rows * num_columns * 2), 0) as capacity FROM rooms');
        const [tRows] = await db.query('SELECT COUNT(*) as count FROM teachers');

        res.json({ 
            success: true, 
            data: { 
                studentCount: sRows[0]?.count || 0, 
                roomCount: rRows[0]?.count || 0, 
                totalCapacity: rRows[0]?.capacity || 0, 
                teacherCount: tRows[0]?.count || 0 
            } 
        });
    } catch (err) {
        console.error('Core Stats Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/dashboard-stats', async (req, res) => {
    try {
        // Safe query helper: isolated execution ensures one failure doesn't break the sync
        const safeFetch = async (query) => {
            try { 
                const [rows] = await db.query(query);
                return rows || []; 
            } catch (e) { 
                console.error(`Institutional Sync Error [${query}]:`, e.message); 
                return []; 
            }
        };

        // Fetch all primary institutional data in parallel
        const [students, teachers, rooms, domains, programs, departments] = await Promise.all([
            safeFetch('SELECT * FROM students'),
            safeFetch('SELECT * FROM teachers'),
            safeFetch('SELECT * FROM rooms'),
            safeFetch('SELECT * FROM domains'),
            safeFetch('SELECT * FROM programs'),
            safeFetch('SELECT * FROM departments')
        ]);

        // 1. Overall Institutional Metrics
        const stats = {
            overall: {
                students: students.length,
                teachers: teachers.length,
                rooms: rooms.length,
                capacity: rooms.reduce((acc, r) => acc + (parseInt(r.num_rows || 0) * parseInt(r.num_columns || 0) * 2), 0),
                domains: domains.length
            },
            domains: [],
            departments: []
        };

        // 2. Map Multi-Dimensional Domain Analytics
        for (const dom of domains) {
            const domPrograms = (programs || []).filter(p => p.domain_id === dom.id);
            const domProgramIds = domPrograms.map(p => p.id);
            const domDepts = (departments || []).filter(d => domProgramIds.includes(d.program_id));
            const domDeptNames = domDepts.map(d => d.name);
            
            const studentCount = (students || []).filter(s => domDeptNames.includes(s.branch)).length;
            const teacherCount = (teachers || []).filter(t => {
                const depts = String(t.department || '').split(',').map(s => s.trim());
                return depts.some(deptName => domDeptNames.includes(deptName));
            }).length;

            stats.domains.push({
                id: dom.id, 
                name: dom.name,
                student_count: studentCount, 
                teacher_estimate: teacherCount
            });
        }

        // 3. Map High-Density Departmental Summary
        for (const dept of (departments || [])) {
            const prog = (programs || []).find(p => p.id === dept.program_id);
            const dom = prog ? (domains || []).find(d => d.id === prog.domain_id) : null;
            const studentCount = (students || []).filter(s => s.branch === dept.name).length;
            const teacherCount = (teachers || []).filter(t => String(t.department || '').includes(dept.name)).length;

            stats.departments.push({
                id: dept.id, 
                name: dept.name,
                program_name: prog ? prog.name : 'Institutional', 
                domain_name: dom ? dom.name : 'Core',
                student_count: studentCount, 
                teacher_count: teacherCount
            });
        }

        res.json({ success: true, data: stats });
    } catch (err) {
        console.error('🔥 Critical Analytics Fault:', err);
        res.status(500).json({ success: false, message: 'Institutional Engine Offline: ' + err.message });
    }
});

// DELETE /exam-engine/sessions/:sessionId - Delete a seating session
router.delete('/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        await db.query('DELETE FROM seating_assignments WHERE session_id = ?', [sessionId]);
        await db.query('DELETE FROM teacher_allocations WHERE session_id = ?', [sessionId]);
        await db.query('DELETE FROM exam_sessions WHERE id = ?', [sessionId]);
        res.json({ success: true, message: 'Session deleted successfully' });
    } catch (err) {
        console.error('Delete Session Error:', err);
        res.status(500).json({ success: false, message: 'Delete failed: ' + err.message });
    }
});

// GET /exam-engine/teacher-allocation/:sessionId - Get teachers for a session
router.get('/teacher-allocation/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const [allocations] = await db.query(`
            SELECT t.name as teacher_name, t.department, ta.room_id 
            FROM teacher_allocations ta 
            JOIN teachers t ON ta.teacher_id = t.id 
            WHERE ta.session_id = ?
        `, [sessionId]);
        res.json({ success: true, data: allocations });
    } catch (err) {
        console.error('Teacher Allocation Fetch Error:', err);
        res.status(500).json({ success: false, message: 'Fetch failed: ' + err.message });
    }
});

module.exports = router;
