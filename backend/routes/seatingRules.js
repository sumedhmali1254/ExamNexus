// =============================================
// Seating Rules Routes
// CRUD for exam seating rule configuration
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /seating-rules - Fetch current rules
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM seating_rules WHERE id = 1');
        res.json({ success: true, data: rows[0] || {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /seating-rules - Update rules
router.put('/', async (req, res) => {
    const {
        seats_per_bench, same_dept_same_bench, same_year_same_bench,
        same_div_same_bench, same_dept_adjacent, same_year_adjacent,
        max_depts_per_room, max_years_per_room, roll_preference,
        room_alloc_mode, room_priority
    } = req.body;

    try {
        await db.query(`UPDATE seating_rules SET 
            seats_per_bench = ?, same_dept_same_bench = ?, same_year_same_bench = ?,
            same_div_same_bench = ?, same_dept_adjacent = ?, same_year_adjacent = ?,
            max_depts_per_room = ?, max_years_per_room = ?, roll_preference = ?,
            room_alloc_mode = ?, room_priority = ?
            WHERE id = 1`, [
            seats_per_bench, same_dept_same_bench ? 1 : 0, same_year_same_bench ? 1 : 0,
            same_div_same_bench ? 1 : 0, same_dept_adjacent ? 1 : 0, same_year_adjacent ? 1 : 0,
            max_depts_per_room, max_years_per_room, roll_preference,
            room_alloc_mode, room_priority
        ]);
        res.json({ success: true, message: 'Rules updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
