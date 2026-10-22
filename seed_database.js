const fs = require('fs');
const path = require('path');
const db = require('./backend/db');

// Realistic name pools
const firstNames = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
  "Shaurya", "Atharva", "Advik", "Pranav", "Advaith", "Aaryan", "Dhruv", "Kabir", "Ritvik", "Darsh",
  "Ananya", "Diya", "Gauri", "Isha", "Kavya", "Khushi", "Mira", "Myra", "Navya", "Pari",
  "Prisha", "Riya", "Saanvi", "Sara", "Siya", "Tanvi", "Veda", "Zara", "Aadhya", "Anika",
  "Rohan", "Rahul", "Amit", "Siddharth", "Vikram", "Neha", "Pooja", "Sneha", "Priya", "Meera",
  "Akash", "Varun", "Karan", "Kunal", "Harsh", "Simran", "Tanya", "Nisha", "Swati", "Deepika",
  "Yash", "Gaurav", "Nikhil", "Manish", "Abhishek", "Shreya", "Riddhi", "Siddhi", "Anjali", "Bhavna",
  "Chetan", "Dev", "Eshan", "Farhan", "Girish", "Irfan", "Jatin", "Kailash", "Lalit", "Mohit",
  "Naveen", "Omkar", "Parth", "Qasim", "Rakesh", "Sachin", "Tejas", "Umesh", "Vineet", "Zaid"
];

const lastNames = [
  "Sharma", "Verma", "Gupta", "Mehta", "Patel", "Joshi", "Bhat", "Deshmukh", "Kulkarni", "Patil",
  "Reddy", "Nair", "Menon", "Iyer", "Rao", "Chauhan", "Singh", "Kumar", "Mishra", "Pandey",
  "Agarwal", "Bansal", "Goel", "Garg", "Jain", "Shah", "Modi", "Trivedi", "Shukla", "Dubey",
  "Malhotra", "Kapoor", "Khanna", "Saxena", "Chopra", "Sethi", "Bhatia", "Ahluwalia", "Gill", "Sandhu"
];

const domains = [
  { id: 1, name: "Engineering & Technology" },
  { id: 2, name: "Applied Sciences" },
  { id: 3, name: "Management & Commerce" }
];

const programs = [
  // Engineering (domain_id: 1)
  { id: 1, domain_id: 1, name: "B.Tech.", duration_years: 4 },
  { id: 2, domain_id: 1, name: "B.E.", duration_years: 4 },
  // Sciences (domain_id: 2)
  { id: 3, domain_id: 2, name: "B.Sc.", duration_years: 3 },
  { id: 4, domain_id: 2, name: "M.Sc.", duration_years: 2 },
  // Management (domain_id: 3)
  { id: 5, domain_id: 3, name: "BBA", duration_years: 3 },
  { id: 6, domain_id: 3, name: "MBA", duration_years: 2 },
  { id: 7, domain_id: 3, name: "B.Com.", duration_years: 3 }
];

const departments = [
  // --- Engineering: B.Tech. (duration 4) ---
  { id: 1, program_id: 1, name: "Computer Science & Engineering", code: "CSE", domain: "Engineering & Technology", program: "B.Tech.", years: 4 },
  { id: 2, program_id: 1, name: "Information Technology", code: "IT", domain: "Engineering & Technology", program: "B.Tech.", years: 4 },
  { id: 3, program_id: 1, name: "Artificial Intelligence & Data Science", code: "AIDS", domain: "Engineering & Technology", program: "B.Tech.", years: 4 },
  { id: 4, program_id: 1, name: "Artificial Intelligence & Machine Learning", code: "AIML", domain: "Engineering & Technology", program: "B.Tech.", years: 4 },
  { id: 5, program_id: 1, name: "Electronics & Telecommunication Engineering", code: "EXTC", domain: "Engineering & Technology", program: "B.Tech.", years: 4 },
  { id: 6, program_id: 1, name: "Data Science", code: "DS", domain: "Engineering & Technology", program: "B.Tech.", years: 4 },
  { id: 7, program_id: 1, name: "Robotics & Automation", code: "ROBO", domain: "Engineering & Technology", program: "B.Tech.", years: 4 },

  // --- Engineering: B.E. (duration 4) ---
  { id: 8, program_id: 2, name: "Computer Engineering", code: "COMP", domain: "Engineering & Technology", program: "B.E.", years: 4 },
  { id: 9, program_id: 2, name: "Electrical Engineering", code: "EE", domain: "Engineering & Technology", program: "B.E.", years: 4 },
  { id: 10, program_id: 2, name: "Mechanical Engineering", code: "MECH", domain: "Engineering & Technology", program: "B.E.", years: 4 },
  { id: 11, program_id: 2, name: "Civil Engineering", code: "CIVIL", domain: "Engineering & Technology", program: "B.E.", years: 4 },
  { id: 12, program_id: 2, name: "Chemical Engineering", code: "CHEM", domain: "Engineering & Technology", program: "B.E.", years: 4 },
  { id: 13, program_id: 2, name: "Instrumentation Engineering", code: "INST", domain: "Engineering & Technology", program: "B.E.", years: 4 },
  { id: 14, program_id: 2, name: "Aerospace Engineering", code: "AERO", domain: "Engineering & Technology", program: "B.E.", years: 4 },

  // --- Applied Sciences: B.Sc. (duration 3) ---
  { id: 15, program_id: 3, name: "Physics", code: "PHYS", domain: "Applied Sciences", program: "B.Sc.", years: 3 },
  { id: 16, program_id: 3, name: "Chemistry", code: "CHEM", domain: "Applied Sciences", program: "B.Sc.", years: 3 },
  { id: 17, program_id: 3, name: "Mathematics", code: "MATH", domain: "Applied Sciences", program: "B.Sc.", years: 3 },
  { id: 18, program_id: 3, name: "Statistics", code: "STAT", domain: "Applied Sciences", program: "B.Sc.", years: 3 },
  { id: 19, program_id: 3, name: "Botany", code: "BOTA", domain: "Applied Sciences", program: "B.Sc.", years: 3 },
  { id: 20, program_id: 3, name: "Zoology", code: "ZOOL", domain: "Applied Sciences", program: "B.Sc.", years: 3 },
  { id: 21, program_id: 3, name: "Microbiology", code: "MICR", domain: "Applied Sciences", program: "B.Sc.", years: 3 },
  { id: 22, program_id: 3, name: "Biotechnology", code: "BIOTECH", domain: "Applied Sciences", program: "B.Sc.", years: 3 },

  // --- Applied Sciences: M.Sc. (duration 2) ---
  { id: 23, program_id: 4, name: "Physics", code: "PHYS", domain: "Applied Sciences", program: "M.Sc.", years: 2 },
  { id: 24, program_id: 4, name: "Chemistry", code: "CHEM", domain: "Applied Sciences", program: "M.Sc.", years: 2 },
  { id: 25, program_id: 4, name: "Mathematics", code: "MATH", domain: "Applied Sciences", program: "M.Sc.", years: 2 },
  { id: 26, program_id: 4, name: "Biotechnology", code: "BIOTECH", domain: "Applied Sciences", program: "M.Sc.", years: 2 },

  // --- Management & Commerce: BBA (duration 3) ---
  { id: 27, program_id: 5, name: "Finance & Analytics", code: "FIN", domain: "Management & Commerce", program: "BBA", years: 3 },
  { id: 28, program_id: 5, name: "Marketing & Strategy", code: "MKT", domain: "Management & Commerce", program: "BBA", years: 3 },
  { id: 29, program_id: 5, name: "Human Resource Management", code: "HRM", domain: "Management & Commerce", program: "BBA", years: 3 },

  // --- Management & Commerce: MBA (duration 2) ---
  { id: 30, program_id: 6, name: "Finance & Analytics", code: "FIN", domain: "Management & Commerce", program: "MBA", years: 2 },
  { id: 31, program_id: 6, name: "Marketing & Strategy", code: "MKT", domain: "Management & Commerce", program: "MBA", years: 2 },
  { id: 32, program_id: 6, name: "Operations & Logistics", code: "OPS", domain: "Management & Commerce", program: "MBA", years: 2 },

  // --- Management & Commerce: B.Com. (duration 3) ---
  { id: 33, program_id: 7, name: "Accounting & Taxation", code: "ACCT", domain: "Management & Commerce", program: "B.Com.", years: 3 },
  { id: 34, program_id: 7, name: "Banking & Insurance", code: "BANK", domain: "Management & Commerce", program: "B.Com.", years: 3 }
];

const examTypes = [
  { id: 1, domain_id: 1, name: "End-Semester Examination", total_marks: 100, duration_mins: 180 },
  { id: 2, domain_id: 1, name: "Mid-Semester Assessment", total_marks: 50, duration_mins: 90 },
  { id: 3, domain_id: 2, name: "Semester Final Theory", total_marks: 100, duration_mins: 180 },
  { id: 4, domain_id: 3, name: "Comprehensive Assessment", total_marks: 100, duration_mins: 150 }
];

const rooms = [
  { id: 1, room_number: "Hall 101", num_rows: 5, num_columns: 4 },
  { id: 2, room_number: "Hall 102", num_rows: 5, num_columns: 4 },
  { id: 3, room_number: "Hall 103", num_rows: 6, num_columns: 4 },
  { id: 4, room_number: "Hall 104", num_rows: 6, num_columns: 4 },
  { id: 5, room_number: "Hall 201", num_rows: 5, num_columns: 5 },
  { id: 6, room_number: "Hall 202", num_rows: 5, num_columns: 5 },
  { id: 7, room_number: "Hall 203", num_rows: 6, num_columns: 5 },
  { id: 8, room_number: "Hall 204", num_rows: 6, num_columns: 5 },
  { id: 9, room_number: "Hall 301", num_rows: 7, num_columns: 4 },
  { id: 10, room_number: "Hall 302", num_rows: 7, num_columns: 4 },
  { id: 11, room_number: "Auditorium A", num_rows: 8, num_columns: 6 },
  { id: 12, room_number: "Auditorium B", num_rows: 8, num_columns: 6 },
  { id: 13, room_number: "Seminar Hall 1", num_rows: 4, num_columns: 6 },
  { id: 14, room_number: "Seminar Hall 2", num_rows: 4, num_columns: 6 }
];

const teachers = [
  { name: "Dr. Arvind Rao", department: "Computer Science & Engineering", domain: "Engineering & Technology", email: "a.rao@exam.edu" },
  { name: "Prof. Sunita Deshmukh", department: "Computer Science & Engineering", domain: "Engineering & Technology", email: "s.deshmukh@exam.edu" },
  { name: "Dr. Rajesh Kulkarni", department: "Information Technology", domain: "Engineering & Technology", email: "r.kulkarni@exam.edu" },
  { name: "Prof. Priya Nair", department: "Information Technology", domain: "Engineering & Technology", email: "p.nair@exam.edu" },
  { name: "Dr. Manish Iyer", department: "Artificial Intelligence & Data Science", domain: "Engineering & Technology", email: "m.iyer@exam.edu" },
  { name: "Prof. Deepa Sharma", department: "Artificial Intelligence & Data Science", domain: "Engineering & Technology", email: "d.sharma@exam.edu" },
  { name: "Dr. Vikram Joshi", department: "Artificial Intelligence & Machine Learning", domain: "Engineering & Technology", email: "v.joshi@exam.edu" },
  { name: "Prof. Anjali Verma", department: "Artificial Intelligence & Machine Learning", domain: "Engineering & Technology", email: "a.verma@exam.edu" },
  { name: "Dr. Suresh Patil", department: "Electronics & Telecommunication Engineering", domain: "Engineering & Technology", email: "s.patil@exam.edu" },
  { name: "Prof. Kavita Bhat", department: "Electronics & Telecommunication Engineering", domain: "Engineering & Technology", email: "k.bhat@exam.edu" },
  { name: "Dr. Manoj Gupta", department: "Computer Engineering", domain: "Engineering & Technology", email: "m.gupta@exam.edu" },
  { name: "Prof. Meera Shukla", department: "Computer Engineering", domain: "Engineering & Technology", email: "m.shukla@exam.edu" },
  { name: "Dr. Hemant Chauhan", department: "Electrical Engineering", domain: "Engineering & Technology", email: "h.chauhan@exam.edu" },
  { name: "Prof. Pooja Reddy", department: "Electrical Engineering", domain: "Engineering & Technology", email: "p.reddy@exam.edu" },
  { name: "Dr. Ashok Mehta", department: "Mechanical Engineering", domain: "Engineering & Technology", email: "a.mehta@exam.edu" },
  { name: "Prof. Rakesh Singh", department: "Mechanical Engineering", domain: "Engineering & Technology", email: "r.singh@exam.edu" },
  { name: "Dr. Neha Trivedi", department: "Civil Engineering", domain: "Engineering & Technology", email: "n.trivedi@exam.edu" },
  { name: "Prof. Sandeep Bansal", department: "Civil Engineering", domain: "Engineering & Technology", email: "s.bansal@exam.edu" },
  { name: "Dr. Alok Pandey", department: "Chemical Engineering", domain: "Engineering & Technology", email: "a.pandey@exam.edu" },
  { name: "Prof. Sneha Agarwal", department: "Chemical Engineering", domain: "Engineering & Technology", email: "s.agarwal@exam.edu" },
  { name: "Dr. Nitin Saxena", department: "Robotics & Automation", domain: "Engineering & Technology", email: "n.saxena@exam.edu" },
  { name: "Prof. Swati Chopra", department: "Robotics & Automation", domain: "Engineering & Technology", email: "s.chopra@exam.edu" },
  { name: "Dr. Rahul Dubey", department: "Aerospace Engineering", domain: "Engineering & Technology", email: "r.dubey@exam.edu" },
  { name: "Prof. Varun Sethi", department: "Instrumentation Engineering", domain: "Engineering & Technology", email: "v.sethi@exam.edu" },
  { name: "Dr. Preeti Jain", department: "Data Science", domain: "Engineering & Technology", email: "p.jain@exam.edu" },
  // Sciences Teachers
  { name: "Dr. Ramanathan Iyer", department: "Physics", domain: "Applied Sciences", email: "r.iyer@exam.edu" },
  { name: "Prof. Vandana Joshi", department: "Physics", domain: "Applied Sciences", email: "v.joshi@exam.edu" },
  { name: "Dr. Sunilkumar Roy", department: "Chemistry", domain: "Applied Sciences", email: "s.roy@exam.edu" },
  { name: "Prof. Alka Sen", department: "Chemistry", domain: "Applied Sciences", email: "a.sen@exam.edu" },
  { name: "Dr. Sanjeev Khanna", department: "Mathematics", domain: "Applied Sciences", email: "s.khanna@exam.edu" },
  { name: "Prof. Tanvi Shah", department: "Statistics", domain: "Applied Sciences", email: "t.shah@exam.edu" },
  { name: "Dr. Jayant Patil", department: "Botany", domain: "Applied Sciences", email: "j.patil@exam.edu" },
  { name: "Prof. Shalini Mishra", department: "Zoology", domain: "Applied Sciences", email: "s.mishra@exam.edu" },
  { name: "Dr. Madhavi Kulkarni", department: "Microbiology", domain: "Applied Sciences", email: "m.kulkarni@exam.edu" },
  { name: "Prof. Anand Deshmukh", department: "Biotechnology", domain: "Applied Sciences", email: "a.deshmukh@exam.edu" },
  // Management Teachers
  { name: "Dr. Vivek Modi", department: "Finance & Analytics", domain: "Management & Commerce", email: "v.modi@exam.edu" },
  { name: "Prof. Shruti Bhatia", department: "Marketing & Strategy", domain: "Management & Commerce", email: "s.bhatia@exam.edu" },
  { name: "Dr. Eshan Kapoor", department: "Human Resource Management", domain: "Management & Commerce", email: "e.kapoor@exam.edu" },
  { name: "Prof. Namrata Pillai", department: "Accounting & Taxation", domain: "Management & Commerce", email: "n.pillai@exam.edu" },
  { name: "Dr. Sandeep Rao", department: "Banking & Insurance", domain: "Management & Commerce", email: "s.rao@exam.edu" }
];

// Generate Students: Every department has students in EVERY applicable year!
const students = [];
let studentId = 1;

departments.forEach((dept) => {
  const yearsCount = dept.years || 3;
  // Distribute students equally across all available years
  const studentsPerYear = 6; // 6 students per year (3 in Div A, 3 in Div B)

  for (let y = 1; y <= yearsCount; y++) {
    for (let i = 1; i <= studentsPerYear; i++) {
      const idx = studentId - 1;
      const fn = firstNames[(idx * 7 + i * 3) % firstNames.length];
      const ln = lastNames[(idx * 11 + i * 5) % lastNames.length];
      const fullName = `${fn} ${ln}`;
      
      const division = i % 2 === 0 ? "B" : "A";
      const yearPrefix = 25 - y;
      const rollNumber = `${dept.code}${dept.program.replace(/[^A-Za-z]/g, '').slice(0, 3)}${yearPrefix}${String(i).padStart(3, '0')}`;
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${studentId}@exam.edu`;

      students.push({
        id: studentId++,
        name: fullName,
        roll_number: rollNumber,
        branch: dept.name,
        domain: dept.domain,
        program: dept.program,
        year: y,
        division: division,
        email: email
      });
    }
  }
});

console.log(`Generated ${students.length} students across ${departments.length} departments, ${teachers.length} teachers, ${rooms.length} rooms.`);

// Build SQL content
let sql = `-- ==========================================================
-- SMART EXAM SEATING OPTIMIZER - COMPLETE SEED SCRIPT
-- Populates 3 Domains, 7 Programs, 34 Departments, 14 Rooms,
-- 40 Teachers, and ${students.length} Students (Available for all Years & Depts)
-- ==========================================================

USE exam_seating_optimizer;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE teacher_allocations;
TRUNCATE TABLE seating_assignments;
TRUNCATE TABLE exam_sessions;
TRUNCATE TABLE teacher_allocation;
TRUNCATE TABLE seating;
TRUNCATE TABLE students;
TRUNCATE TABLE teachers;
TRUNCATE TABLE rooms;
TRUNCATE TABLE exam_types;
TRUNCATE TABLE departments;
TRUNCATE TABLE programs;
TRUNCATE TABLE domains;
TRUNCATE TABLE seating_rules;
TRUNCATE TABLE admins;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. ADMIN
INSERT INTO admins (id, name, email, password) VALUES
(1, 'System Administrator', 'admin@exam.com', 'admin123');

-- 2. DOMAINS
INSERT INTO domains (id, name) VALUES
${domains.map(d => `(${d.id}, '${d.name}')`).join(',\n')};

-- 3. PROGRAMS
INSERT INTO programs (id, domain_id, name, duration_years) VALUES
${programs.map(p => `(${p.id}, ${p.domain_id}, '${p.name}', ${p.duration_years})`).join(',\n')};

-- 4. DEPARTMENTS
INSERT INTO departments (id, program_id, name) VALUES
${departments.map(d => `(${d.id}, ${d.program_id}, '${d.name}')`).join(',\n')};

-- 5. EXAM TYPES
INSERT INTO exam_types (id, domain_id, name, total_marks, duration_mins) VALUES
${examTypes.map(e => `(${e.id}, ${e.domain_id}, '${e.name}', ${e.total_marks}, ${e.duration_mins})`).join(',\n')};

-- 6. ROOMS (EXAMINATION HALLS)
INSERT INTO rooms (id, room_number, num_rows, num_columns) VALUES
${rooms.map(r => `(${r.id}, '${r.room_number}', ${r.num_rows}, ${r.num_columns})`).join(',\n')};

-- 7. TEACHERS
INSERT INTO teachers (name, department, domain, email) VALUES
${teachers.map(t => `('${t.name}', '${t.department}', '${t.domain}', '${t.email}')`).join(',\n')};

-- 8. SEATING RULES
INSERT INTO seating_rules (
    id, seats_per_bench, same_dept_same_bench, same_year_same_bench,
    same_div_same_bench, same_dept_adjacent, same_year_adjacent,
    max_depts_per_room, max_years_per_room, roll_preference,
    room_alloc_mode, room_priority
) VALUES (
    1, 2, 0, 0, 0, 0, 0, 4, 2, 'no_preference', 'fill_full', 'no_preference'
);

-- 9. STUDENTS (${students.length} STUDENTS COVERING ALL DOMAINS, DEPARTMENTS & YEARS)
INSERT INTO students (id, name, roll_number, branch, domain, program, year, division, email) VALUES
${students.map(s => `(${s.id}, '${s.name}', '${s.roll_number}', '${s.branch}', '${s.domain}', '${s.program}', ${s.year}, '${s.division}', '${s.email}')`).join(',\n')};

-- ==========================================================
-- SEED DATA COMPLETE
-- ==========================================================
`;

const seedFilePath = path.join(__dirname, 'seed.sql');
fs.writeFileSync(seedFilePath, sql, 'utf8');
console.log(`✅ seed.sql written to: ${seedFilePath}`);

// Apply to MySQL directly
async function run() {
  console.log('🔄 Executing clean seed to MySQL database...');
  try {
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE teacher_allocations');
    await db.query('TRUNCATE TABLE seating_assignments');
    await db.query('TRUNCATE TABLE exam_sessions');
    await db.query('TRUNCATE TABLE teacher_allocation');
    await db.query('TRUNCATE TABLE seating');
    await db.query('TRUNCATE TABLE students');
    await db.query('TRUNCATE TABLE teachers');
    await db.query('TRUNCATE TABLE rooms');
    await db.query('TRUNCATE TABLE exam_types');
    await db.query('TRUNCATE TABLE departments');
    await db.query('TRUNCATE TABLE programs');
    await db.query('TRUNCATE TABLE domains');
    await db.query('TRUNCATE TABLE seating_rules');
    await db.query('TRUNCATE TABLE admins');
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    await db.query("INSERT INTO admins (id, name, email, password) VALUES (1, 'System Administrator', 'admin@exam.com', 'admin123')");
    
    for (const d of domains) {
      await db.query('INSERT INTO domains (id, name) VALUES (?, ?)', [d.id, d.name]);
    }
    for (const p of programs) {
      await db.query('INSERT INTO programs (id, domain_id, name, duration_years) VALUES (?, ?, ?, ?)', [p.id, p.domain_id, p.name, p.duration_years]);
    }
    for (const d of departments) {
      await db.query('INSERT INTO departments (id, program_id, name) VALUES (?, ?, ?)', [d.id, d.program_id, d.name]);
    }
    for (const e of examTypes) {
      await db.query('INSERT INTO exam_types (id, domain_id, name, total_marks, duration_mins) VALUES (?, ?, ?, ?, ?)', [e.id, e.domain_id, e.name, e.total_marks, e.duration_mins]);
    }
    for (const r of rooms) {
      await db.query('INSERT INTO rooms (id, room_number, num_rows, num_columns) VALUES (?, ?, ?, ?)', [r.id, r.room_number, r.num_rows, r.num_columns]);
    }
    for (const t of teachers) {
      await db.query('INSERT INTO teachers (name, department, domain, email) VALUES (?, ?, ?, ?)', [t.name, t.department, t.domain, t.email]);
    }
    await db.query(`INSERT INTO seating_rules (id, seats_per_bench, same_dept_same_bench, same_year_same_bench, same_div_same_bench, same_dept_adjacent, same_year_adjacent, max_depts_per_room, max_years_per_room, roll_preference, room_alloc_mode, room_priority) VALUES (1, 2, 0, 0, 0, 0, 0, 4, 2, 'no_preference', 'fill_full', 'no_preference')`);

    console.log(`Inserting ${students.length} students...`);
    const batchSize = 100;
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const values = batch.map(s => [s.id, s.name, s.roll_number, s.branch, s.domain, s.program, s.year, s.division, s.email]);
      await db.query('INSERT INTO students (id, name, roll_number, branch, domain, program, year, division, email) VALUES ?', [values]);
    }

    console.log(`🎉 SUCCESS! Cleanly populated ${students.length} students in all 34 departments!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed database:', err);
    process.exit(1);
  }
}

run();
