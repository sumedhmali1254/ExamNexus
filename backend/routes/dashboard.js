const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/health', (req, res) => res.json({ status: 'ok', module: 'dashboard' }));

router.get('/stats', async (req, res) => {
    try {
        const stats = {};

        // 1. Overall Totals
        const [studentTotal] = await db.query('SELECT COUNT(*) as count FROM students');
        const [teacherTotal] = await db.query('SELECT COUNT(*) as count FROM teachers');
        const [roomTotal] = await db.query('SELECT COUNT(*) as count, SUM(num_rows * num_columns * 2) as total_capacity FROM rooms');
        const [domainTotal] = await db.query('SELECT COUNT(*) as count FROM domains');

        stats.overall = {
            students: studentTotal[0].count,
            teachers: teacherTotal[0].count,
            rooms: roomTotal[0].count,
            capacity: roomTotal[0].total_capacity || 0,
            domains: domainTotal[0].count
        };

        // 2. Domain Breakdown (Students & Faculty)
        // Students are linked to departments (branch column in students table stores the name)
        // This is a bit tricky since branch name is stored. I'll join with departments table.
        const [domainStats] = await db.query(`
            SELECT 
                d.id, d.name, 
                (SELECT COUNT(*) FROM students s 
                 JOIN departments dept ON s.branch = dept.name 
                 JOIN programs p ON dept.program_id = p.id 
                 WHERE p.domain_id = d.id) as student_count,
                 (SELECT COUNT(*) FROM teachers t 
                  WHERE t.department LIKE CONCAT('%', (SELECT name FROM departments dept JOIN programs p ON dept.program_id = p.id WHERE p.domain_id = d.id LIMIT 1), '%')) as teacher_estimate
            FROM domains d
        `);
        // Note: Teacher estimate is rough because it's a comma separated string.
        
        stats.domains = domainStats;

        // 3. Department Breakdown
        const [deptStats] = await db.query(`
            SELECT 
                dept.id, dept.name, p.name as program_name, d.name as domain_name,
                (SELECT COUNT(*) FROM students WHERE branch = dept.name) as student_count
            FROM departments dept
            JOIN programs p ON dept.program_id = p.id
            JOIN domains d ON p.domain_id = d.id
        `);
        stats.departments = deptStats;

        res.json({ success: true, data: stats });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
