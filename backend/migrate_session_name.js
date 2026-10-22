const db = require('./db');

async function migrate() {
    try {
        console.log('🔄 Checking database schema...');
        
        // Add session_name to exam_sessions
        try {
            await db.query('ALTER TABLE exam_sessions ADD COLUMN session_name VARCHAR(255) DEFAULT NULL AFTER id');
            console.log('✅ Added session_name to exam_sessions table');
        } catch (err) {
            if (err.code === 'ER_DUP_COLUMN_NAME') {
                console.log('ℹ️ session_name already exists in exam_sessions');
            } else {
                console.error('❌ Error adding column to exam_sessions:', err.message);
            }
        }

        console.log('🏁 Migration check complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
