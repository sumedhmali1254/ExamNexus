// =============================================
// Rooms Routes
// CRUD operations for room management
// =============================================

const express = require('express');
const router = express.Router();
const db = require('../db');

// -----------------------------------------
// GET /rooms - Fetch all rooms
// -----------------------------------------
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM rooms ORDER BY room_number');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching rooms:', err);
        res.status(500).json({ success: false, message: 'Database Error: ' + err.message });
    }
});

// -----------------------------------------
// GET /rooms/available - Fetch active rooms with capacity details
// -----------------------------------------
router.get('/available', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id, room_number as room_name, 
                num_rows, num_columns,
                1 as floor, 
                (num_rows * num_columns) as total_benches, 
                2 as seats_per_bench, 
                (num_rows * num_columns * 2) as effective_capacity,
                1 as is_active 
            FROM rooms 
            ORDER BY room_number
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching available rooms:', err);
        res.status(500).json({ success: false, message: 'Database Error: ' + err.message });
    }
});

// -----------------------------------------
// POST /rooms - Add a new room
// -----------------------------------------
router.post('/', async (req, res) => {
    const { room_number, num_rows, num_columns } = req.body;

    // Validate input
    if (!room_number || !num_rows || !num_columns) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required: room_number, num_rows, num_columns' 
        });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO rooms (room_number, num_rows, num_columns) VALUES (?, ?, ?)',
            [room_number, parseInt(num_rows), parseInt(num_columns)]
        );
        res.json({ 
            success: true, 
            message: 'Room added successfully', 
            id: result.insertId 
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                message: 'Room number already exists' 
            });
        }
        console.error('Error adding room:', err);
        res.status(500).json({ success: false, message: 'Database Error: ' + err.message });
    }
});

// -----------------------------------------
// PUT /rooms/:id - Update an existing room
// -----------------------------------------
router.put('/:id', async (req, res) => {
    const { room_number, num_rows, num_columns } = req.body;
    const { id } = req.params;

    if (!room_number || !num_rows || !num_columns) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required' 
        });
    }

    try {
        const [result] = await db.query(
            'UPDATE rooms SET room_number = ?, num_rows = ?, num_columns = ? WHERE id = ?',
            [room_number, parseInt(num_rows), parseInt(num_columns), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        res.json({ success: true, message: 'Room updated successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Room number already exists' });
        }
        console.error('Error updating room:', err);
        res.status(500).json({ success: false, message: 'Database Error: ' + err.message });
    }
});

// -----------------------------------------
// DELETE /rooms/:id - Delete a room
// -----------------------------------------
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        res.json({ success: true, message: 'Room deleted successfully' });
    } catch (err) {
        console.error('Error deleting room:', err);
        res.status(500).json({ success: false, message: 'Database Error: ' + err.message });
    }
});

module.exports = router;
