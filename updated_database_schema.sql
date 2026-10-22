-- ==========================================================
-- SMART EXAM SEATING OPTIMIZER - FULL DATABASE SCHEMA
-- This file contains all tables and queries required to 
-- set up the project database from scratch.
-- ==========================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS exam_seating_optimizer;
USE exam_seating_optimizer;

-- ----------------------------
-- Table: admins
-- Stores admin accounts for login
-- ----------------------------
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Table: domains
-- Stores top-level institutional domains (e.g., Engineering, Arts)
-- ----------------------------
CREATE TABLE IF NOT EXISTS domains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Table: programs
-- Stores programs under domains (e.g., B.Tech, M.Tech)
-- ----------------------------
CREATE TABLE IF NOT EXISTS programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain_id INT,
    name VARCHAR(100) NOT NULL,
    duration_years INT DEFAULT 4,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- ----------------------------
-- Table: departments
-- Stores departments under programs (e.g., CS, IT, Mechanical)
-- ----------------------------
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

-- ----------------------------
-- Table: exam_types
-- Stores types of exams (e.g., Mid-Sem, Finals)
-- ----------------------------
CREATE TABLE IF NOT EXISTS exam_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain_id INT,
    name VARCHAR(100) NOT NULL,
    total_marks INT DEFAULT 100,
    duration_mins INT DEFAULT 180,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- ----------------------------
-- Table: students
-- Stores comprehensive student registry
-- ----------------------------
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    branch VARCHAR(50) NOT NULL, -- Corresponds to Department Name
    domain VARCHAR(100),
    program VARCHAR(100),
    year INT NOT NULL,
    division VARCHAR(10) DEFAULT 'A',
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Table: rooms
-- Stores exam room/hall configurations
-- ----------------------------
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    num_rows INT NOT NULL,
    num_columns INT NOT NULL,
    capacity INT GENERATED ALWAYS AS (num_rows * num_columns) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Table: teachers
-- Stores faculty information for allocation
-- ----------------------------
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(200) NOT NULL,
    domain VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Table: seating_rules
-- Stores global constraints for seating engine
-- ----------------------------
CREATE TABLE IF NOT EXISTS seating_rules (
    id INT PRIMARY KEY,
    seats_per_bench INT DEFAULT 2,
    same_dept_same_bench TINYINT DEFAULT 0,
    same_year_same_bench TINYINT DEFAULT 0,
    same_div_same_bench TINYINT DEFAULT 0,
    same_dept_adjacent TINYINT DEFAULT 0,
    same_year_adjacent TINYINT DEFAULT 0,
    max_depts_per_room INT DEFAULT 2,
    max_years_per_room INT DEFAULT 2,
    roll_preference VARCHAR(50) DEFAULT 'no_preference',
    room_alloc_mode VARCHAR(50) DEFAULT 'fill_full',
    room_priority VARCHAR(50) DEFAULT 'no_preference'
);

-- Ensure a default rule config exists
INSERT IGNORE INTO seating_rules (id) VALUES (1);

-- ----------------------------
-- Table: exam_sessions
-- Tracks each generation run/exam event
-- ----------------------------
CREATE TABLE IF NOT EXISTS exam_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_name VARCHAR(100),
    domain_id INT,
    exam_pattern_id INT, -- Refers to exam_types.id
    exam_date DATE,
    start_time VARCHAR(50),
    end_time VARCHAR(50),
    status ENUM('generating', 'completed', 'failed') DEFAULT 'generating',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Table: seating_assignments
-- Stores final seat mapping for a session
-- ----------------------------
CREATE TABLE IF NOT EXISTS seating_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    room_id INT,
    bench_number INT,
    seat_position INT, -- 1=Left, 2=Right (or as per rule)
    student_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- ----------------------------
-- Table: teacher_allocations
-- Stores faculty-room assignments for a session
-- ----------------------------
CREATE TABLE IF NOT EXISTS teacher_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    room_id INT,
    teacher_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------
-- LEGACY/TRANSITIONAL TABLES (Used by simpler frontend modules)
-- ----------------------------------------------------------

-- Table: seating (Simplified output for legacy views)
CREATE TABLE IF NOT EXISTS seating (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    bench_number INT NOT NULL,
    seat_position INT NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: teacher_allocation (Simplified output for legacy views)
CREATE TABLE IF NOT EXISTS teacher_allocation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    teacher_name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- END OF SCHEMA
-- ==========================================================
