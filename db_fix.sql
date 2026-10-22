-- Seating Optimizer Database Patch
-- Ensures all necessary tables for the Exam Engine exist

CREATE TABLE IF NOT EXISTS exam_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain_id INT,
    exam_pattern_id INT,
    exam_date DATE,
    start_time VARCHAR(50),
    end_time VARCHAR(50),
    status ENUM('generating', 'completed', 'failed') DEFAULT 'generating',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seating_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    room_id INT,
    bench_number INT,
    seat_position INT,
    student_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teacher_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    room_id INT,
    teacher_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seating_rules (
    id INT PRIMARY KEY,
    seats_per_bench INT DEFAULT 2,
    same_dept_same_bench TINYINT DEFAULT 0,
    same_year_same_bench TINYINT DEFAULT 0,
    same_div_same_bench TINYINT DEFAULT 0,
    max_depts_per_room INT DEFAULT 2,
    max_years_per_room INT DEFAULT 2,
    roll_preference VARCHAR(50) DEFAULT 'no_preference',
    room_alloc_mode VARCHAR(50) DEFAULT 'fill_full',
    room_priority VARCHAR(50) DEFAULT 'no_preference'
);

-- Ensure a default rule exists
INSERT IGNORE INTO seating_rules (id) VALUES (1);
