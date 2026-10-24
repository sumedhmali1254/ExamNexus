const db = require('./db');

async function migrate() {
    try {
        console.log('ðŸ”„ Checking database schema...');
        
        // Add session_name to exam_sessions
        try {
            await db.query('ALTER TABLE exam_sessions ADD COLUMN session_name VARCHAR(255) DEFAULT NULL AFTER id');
            console.log('âœ… Added session_name to exam_sessions table');
        } catch (err) {
            if (err.code === 'ER_DUP_COLUMN_NAME') {
                console.log('â„¹ï¸ session_name already exists in exam_sessions');
            } else {
                console.error('âŒ Error adding column to exam_sessions:', err.message);
            }
        }

        console.log('ðŸ Migration check complete.');
        process.exit(0);
    } catch (err) {
        console.error('âŒ Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
