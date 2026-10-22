// =============================================
// Smart Exam Seating Optimizer - Main Server
// Express.js backend with REST APIs
// =============================================

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middleware ----
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---- Import Routes ----
const studentsRoutes = require('./routes/students');
const roomsRoutes = require('./routes/rooms');
const teachersRoutes = require('./routes/teachers');
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const seatingRulesRoutes = require('./routes/seatingRules');
const examEngineRoutes = require('./routes/examEngine');
const dashboardRoutes = require('./routes/dashboard');

// ---- Register Routes ----
app.use('/auth', authRoutes);
app.use('/students', studentsRoutes);
app.use('/rooms', roomsRoutes);
app.use('/teachers', teachersRoutes);
app.use('/settings', settingsRoutes);
app.use('/seating-rules', seatingRulesRoutes);
app.use('/exam-engine', examEngineRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/api-status', (req, res) => {
    res.json({ success: true, message: 'Backend is active and up-to-date' });
});

// ---- Root Route ----
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ---- Start Server ----
app.listen(PORT, () => {
    console.log(`\n🎓 Smart Exam Seating Optimizer`);
    console.log(`   Server running at: http://localhost:${PORT}`);
    console.log(`   Routes: /students, /rooms, /teachers, /settings`);
    console.log(`   Engine: /exam-engine, /seating-rules\n`);
});
