// =======================================================================
// Native JavaScript Engine for Exam Seating Optimizer
// Implements the DAA algorithms in pure JavaScript:
// 1. Merge Sort (Divide & Conquer)
// 2. Anti-Cheating Seating Allocation (Greedy + Backtracking + Graph Coloring)
// 3. Simple Seating Allocation (Interleaved Graph Coloring)
// 4. Conflict-Free Teacher Allocation (Greedy Room Supervision)
// 5. KMP (Knuth-Morris-Pratt) Substring Search
// 
// Provides seamless execution when C binaries are blocked by Windows 
// Device Guard, WDAC, AppLocker, or Smart App Control policies.
// =======================================================================

/**
 * Merge Sort (O(n log n)) for Students
 * Matches student_sorting.c
 * Orders by: branch -> year -> division -> roll_number
 */
function studentSorting(students) {
    if (!Array.isArray(students) || students.length <= 1) {
        return students ? [...students] : [];
    }

    function compareStudents(a, b) {
        const branchA = (a.branch || '').toString().toLowerCase();
        const branchB = (b.branch || '').toString().toLowerCase();
        const cBranch = branchA.localeCompare(branchB);
        if (cBranch !== 0) return cBranch;

        const yearA = parseInt(a.year, 10) || 0;
        const yearB = parseInt(b.year, 10) || 0;
        if (yearA !== yearB) return yearA - yearB;

        const divA = (a.division || '').toString().toLowerCase();
        const divB = (b.division || '').toString().toLowerCase();
        const cDiv = divA.localeCompare(divB);
        if (cDiv !== 0) return cDiv;

        const rollA = (a.roll_number || a.roll || '').toString();
        const rollB = (b.roll_number || b.roll || '').toString();
        return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
    }

    function merge(left, right) {
        let i = 0, j = 0;
        const result = [];
        while (i < left.length && j < right.length) {
            if (compareStudents(left[i], right[j]) <= 0) {
                result.push(left[i++]);
            } else {
                result.push(right[j++]);
            }
        }
        while (i < left.length) result.push(left[i++]);
        while (j < right.length) result.push(right[j++]);
        return result;
    }

    function mergeSort(arr) {
        if (arr.length <= 1) return arr;
        const mid = Math.floor(arr.length / 2);
        const left = mergeSort(arr.slice(0, mid));
        const right = mergeSort(arr.slice(mid));
        return merge(left, right);
    }

    return mergeSort([...students]);
}

/**
 * Advanced Seating Generator
 * Matches seating_generator.c
 * Greedy assignment + vertical column layout + backtracking lookahead
 */
function generateSeating(studentsList, roomsList, rulesInput) {
    const students = [...(studentsList || [])];
    const rooms = [...(roomsList || [])];
    const rules = rulesInput || {};

    // Parse and normalize rules matching seating_generator.c
    const candidatesPerBench = parseInt(rules.seats_per_bench || rules.candidates_per_bench, 10) || 2;
    
    // In database & frontend schema: 0 means "Restricted/Prevented", 1 means "Allowed"
    const preventSameDept = (rules.same_dept_same_bench === 1 || rules.same_dept_same_bench === '1' || rules.same_dept_same_bench === true) ? 0 : 1;
    const preventSameYear = (rules.same_year_same_bench === 1 || rules.same_year_same_bench === '1' || rules.same_year_same_bench === true) ? 0 : 1;
    
    const maxDeptsPerRoom = parseInt(rules.max_depts_per_room || rules.max_departments_per_room, 10) || 4;
    const maxYearsPerRoom = parseInt(rules.max_years_per_room, 10) || 2;
    
    const isRandomized = (
        rules.roll_preference === 'no_preference' ||
        rules.randomized_seating === 1 ||
        rules.randomized_seating === true ||
        rules.roll_preference === undefined
    );

    // If randomized seating selected, perform Fisher-Yates shuffle
    if (isRandomized && students.length > 1) {
        for (let i = students.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = students[i];
            students[i] = students[j];
            students[j] = tmp;
        }
    }

    const assignments = [];
    let seated = 0;
    let si = 0; // student index

    // Helper: checks whether candidate student s can sit at (room, bench, seat)
    function canSit(roomId, benchNumber, student) {
        // Bench constraints
        for (let i = 0; i < assignments.length; i++) {
            const a = assignments[i];
            if (a.room_id !== roomId || a.bench_number !== benchNumber) continue;

            if (preventSameDept && a.branch && student.branch && a.branch.toLowerCase() === student.branch.toLowerCase()) {
                return false;
            }
            if (preventSameYear && Number(a.year) === Number(student.year)) {
                return false;
            }
        }

        // Room diversity constraints
        const seenDepts = new Set();
        const seenYears = new Set();

        for (let i = 0; i < assignments.length; i++) {
            const a = assignments[i];
            if (a.room_id !== roomId) continue;
            if (a.branch) seenDepts.add(a.branch.toLowerCase());
            if (a.year !== undefined && a.year !== null) seenYears.add(Number(a.year));
        }

        const studentDept = (student.branch || '').toLowerCase();
        if (!seenDepts.has(studentDept) && seenDepts.size >= maxDeptsPerRoom) {
            return false;
        }

        const studentYear = Number(student.year);
        if (!seenYears.has(studentYear) && seenYears.size >= maxYearsPerRoom) {
            return false;
        }

        return true;
    }

    // Traverse rooms and layout seats vertically (column by column, then row by row)
    for (let ri = 0; ri < rooms.length && si < students.length; ri++) {
        const room = rooms[ri];
        const numRows = parseInt(room.num_rows, 10) || 1;
        const numCols = parseInt(room.num_columns, 10) || 1;

        for (let col = 1; col <= numCols && si < students.length; col++) {
            for (let row = 1; row <= numRows && si < students.length; row++) {
                const benchNumber = (row - 1) * numCols + col;

                for (let s = 1; s <= candidatesPerBench && si < students.length; s++) {
                    const currentStudent = students[si];

                    if (canSit(room.id, benchNumber, currentStudent)) {
                        assignments.push({
                            room_id: room.id,
                            room_number: room.room_number,
                            bench_number: benchNumber,
                            seat_position: s,
                            student_id: currentStudent.id,
                            student_name: currentStudent.name,
                            roll_number: currentStudent.roll_number || currentStudent.roll,
                            branch: currentStudent.branch,
                            year: currentStudent.year,
                            division: currentStudent.division || 'A'
                        });
                        seated++;
                        si++;
                    } else {
                        // Backtracking: look ahead up to 20 students to find a valid swap
                        let found = false;
                        const lookaheadLimit = Math.min(si + 20, students.length);

                        for (let k = si + 1; k < lookaheadLimit; k++) {
                            const candidate = students[k];
                            if (canSit(room.id, benchNumber, candidate)) {
                                // Swap students
                                students[k] = students[si];
                                students[si] = candidate;

                                assignments.push({
                                    room_id: room.id,
                                    room_number: room.room_number,
                                    bench_number: benchNumber,
                                    seat_position: s,
                                    student_id: candidate.id,
                                    student_name: candidate.name,
                                    roll_number: candidate.roll_number || candidate.roll,
                                    branch: candidate.branch,
                                    year: candidate.year,
                                    division: candidate.division || 'A'
                                });
                                seated++;
                                si++;
                                found = true;
                                break;
                            }
                        }

                        if (!found) {
                            // Seat skipped to prevent constraint violation
                        }
                    }
                }
            }
        }
    }

    return {
        seated,
        total: students.length,
        assignments
    };
}

/**
 * Simple Seating Generator
 * Matches seating.c
 */
function simpleSeatingGenerator({ students, rooms, rules }) {
    const studentList = [...(students || [])];
    const roomList = [...(rooms || [])];
    const r = rules || {};

    const studentsPerBench = Math.min(2, Math.max(1, parseInt(r.students_per_bench, 10) || 1));
    const allowSameBranch = !!r.allow_same_branch;
    const allowSameYear = !!r.allow_same_year;

    // Sort students by branch, year, roll
    studentList.sort((a, b) => {
        const c1 = (a.branch || '').localeCompare(b.branch || '');
        if (c1 !== 0) return c1;
        const c2 = (Number(a.year) || 0) - (Number(b.year) || 0);
        if (c2 !== 0) return c2;
        return (a.roll || a.roll_number || '').localeCompare(b.roll || b.roll_number || '');
    });

    // Interleave branches if not allowing same branch
    let processedStudents = studentList;
    if (!allowSameBranch) {
        const branchGroups = {};
        for (const s of studentList) {
            const b = s.branch || 'Unknown';
            if (!branchGroups[b]) branchGroups[b] = [];
            branchGroups[b].push(s);
        }
        const branches = Object.keys(branchGroups);
        const interleaved = [];
        let added = true;
        let idx = 0;
        while (added) {
            added = false;
            for (const b of branches) {
                if (idx < branchGroups[b].length) {
                    interleaved.push(branchGroups[b][idx]);
                    added = true;
                }
            }
            idx++;
        }
        processedStudents = interleaved;
    }

    const seating = [];
    let si = 0;
    let totalCapacity = 0;

    for (const room of roomList) {
        const rows = parseInt(room.rows || room.num_rows, 10) || 1;
        const cols = parseInt(room.cols || room.num_columns, 10) || 1;
        const capacity = rows * cols * studentsPerBench;
        totalCapacity += rows * cols;

        const totalBenches = rows * cols;
        for (let b = 1; b <= totalBenches && si < processedStudents.length; b++) {
            for (let s = 1; s <= studentsPerBench && si < processedStudents.length; s++) {
                const st = processedStudents[si++];
                seating.push({
                    room_number: room.room_number,
                    bench_number: b,
                    seat_position: s,
                    student_name: st.name,
                    roll_number: st.roll || st.roll_number,
                    branch: st.branch
                });
            }
        }
    }

    return {
        seating,
        stats: {
            total_students: students.length,
            students_assigned: seating.length,
            students_unassigned: students.length - seating.length,
            total_rooms: roomList.length,
            total_capacity: totalCapacity
        }
    };
}

/**
 * Teacher Allocation Generator
 * Matches teacher_allocation.c
 * Greedy allocation with department diversity
 */
function allocateTeachers({ teachers, rooms }) {
    const teacherList = (teachers || []).map(t => ({ ...t, assigned: false }));
    const roomList = [...(rooms || [])];

    const allocation = [];
    let lastDept = '';

    for (let r = 0; r < roomList.length; r++) {
        let bestTeacherIdx = -1;

        // Greedy 1: Prefer teacher from a different department
        for (let t = 0; t < teacherList.length; t++) {
            if (!teacherList[t].assigned) {
                if (teacherList[t].department !== lastDept) {
                    bestTeacherIdx = t;
                    break;
                }
            }
        }

        // Greedy 2: Pick any available teacher
        if (bestTeacherIdx === -1) {
            for (let t = 0; t < teacherList.length; t++) {
                if (!teacherList[t].assigned) {
                    bestTeacherIdx = t;
                    break;
                }
            }
        }

        if (bestTeacherIdx !== -1) {
            teacherList[bestTeacherIdx].assigned = true;
            allocation.push({
                room_number: roomList[r].room_number,
                teacher_name: teacherList[bestTeacherIdx].name,
                department: teacherList[bestTeacherIdx].department
            });
            lastDept = teacherList[bestTeacherIdx].department;
        }
    }

    const unassignedTeachers = teacherList.filter(t => !t.assigned).length;

    return {
        allocation,
        stats: {
            total_teachers: teacherList.length,
            total_rooms: roomList.length,
            rooms_assigned: allocation.length,
            rooms_unassigned: roomList.length - allocation.length,
            teachers_unassigned: unassignedTeachers
        }
    };
}

/**
 * KMP (Knuth-Morris-Pratt) Substring Search
 * Matches search.c
 */
function kmpSearch(pattern, text) {
    if (!pattern) return true;
    if (!text) return false;

    const pat = pattern.toLowerCase();
    const txt = text.toLowerCase();
    const M = pat.length;
    const N = txt.length;
    if (M === 0) return true;
    if (N < M) return false;

    // Compute LPS array
    const lps = new Array(M).fill(0);
    let len = 0;
    let i = 1;
    while (i < M) {
        if (pat[i] === pat[len]) {
            len++;
            lps[i] = len;
            i++;
        } else {
            if (len !== 0) {
                len = lps[len - 1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }

    // Search
    i = 0;
    let j = 0;
    while (i < N) {
        if (pat[j] === txt[i]) {
            j++;
            i++;
        }
        if (j === M) {
            return true;
        } else if (i < N && pat[j] !== txt[i]) {
            if (j !== 0) {
                j = lps[j - 1];
            } else {
                i++;
            }
        }
    }
    return false;
}

/**
 * Filter items using KMP algorithm matching search.c
 */
function filterWithKMP(items, query, filter1, filter2) {
    const q = (query && query !== 'All') ? query.trim() : '';
    const f1 = (filter1 && filter1 !== 'All') ? filter1.trim() : '';
    const f2 = (filter2 && filter2 !== 'All') ? filter2.trim() : '';

    return (items || []).filter(item => {
        const itemStr = JSON.stringify(item);
        const qMatch = !q || kmpSearch(q, itemStr);
        const f1Match = !f1 || kmpSearch(f1, itemStr);
        const f2Match = !f2 || kmpSearch(f2, itemStr);
        return qMatch && f1Match && f2Match;
    });
}

module.exports = {
    studentSorting,
    generateSeating,
    simpleSeatingGenerator,
    allocateTeachers,
    kmpSearch,
    filterWithKMP
};
