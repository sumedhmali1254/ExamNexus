/*
 * =============================================
 * Smart Exam Seating Optimizer
 * seating.c - Core Seating Algorithm
 * =============================================
 *
 * DAA Concepts Used:
 * 1. Merge Sort (Divide & Conquer) - Sort students by branch/year
 * 2. Greedy Algorithm - Assign seats one by one
 * 3. Backtracking - Fix conflicts when same branch neighbors found
 * 4. Graph Coloring Idea - Treat branches as colors, avoid adjacent same colors
 *
 * Input:  JSON via stdin (students, rooms, rules)
 * Output: JSON via stdout (seating plan)
 *
 * Compile: gcc -std=c99 seating.c -o seating.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* =============================================
   Constants
   ============================================= */
#define MAX_STUDENTS 500
#define MAX_ROOMS 50
#define MAX_NAME 100
#define MAX_BRANCH 50
#define MAX_ROLL 50
#define MAX_INPUT 100000
#define MAX_BRANCHES 20

/* =============================================
   Data Structures
   ============================================= */

/* Student structure */
typedef struct {
  char name[MAX_NAME];
  char roll[MAX_ROLL];
  char branch[MAX_BRANCH];
  int year;
  int assigned; /* 0 = not assigned, 1 = assigned */
} Student;

/* Room structure */
typedef struct {
  char room_number[MAX_NAME];
  int rows;
  int cols;
  int capacity; /* rows * cols */
} Room;

/* Seating rules */
typedef struct {
  int students_per_bench; /* 1 or 2 */
  int allow_same_branch;  /* 0 = no, 1 = yes */
  int allow_same_year;    /* 0 = no, 1 = yes */
} Rules;

/* A single seat assignment */
typedef struct {
  char room_number[MAX_NAME];
  int bench_number;
  int seat_position; /* 1 = left, 2 = right */
  char student_name[MAX_NAME];
  char roll_number[MAX_ROLL];
  char branch[MAX_BRANCH];
} SeatAssignment;

/* =============================================
   Global Variables
   ============================================= */
Student students[MAX_STUDENTS];
Student mergeTemp[MAX_STUDENTS]; /* temp array for merge sort */
Room rooms[MAX_ROOMS];
SeatAssignment seating[MAX_STUDENTS];
int num_students = 0;
int num_rooms = 0;
int num_assigned = 0;

/* =============================================
   MERGE SORT - Divide and Conquer
   Sort students so different branches alternate
   ============================================= */

/*
 * merge() - Merge two sorted halves
 * Part of merge sort (divide and conquer approach)
 */
void merge(Student arr[], int left, int mid, int right) {
  int i, j, k;
  int n1 = mid - left + 1;
  int n2 = right - mid;

  /* Copy data to temp array segments */
  for (i = 0; i < n1; i++)
    mergeTemp[i] = arr[left + i];
  for (j = 0; j < n2; j++)
    mergeTemp[n1 + j] = arr[mid + 1 + j];

  /* Merge back - sort by branch first, then year, then roll */
  i = 0;
  j = 0;
  k = left;
  while (i < n1 && j < n2) {
    int cmp = strcmp(mergeTemp[i].branch, mergeTemp[n1 + j].branch);
    if (cmp < 0) {
      arr[k++] = mergeTemp[i++];
    } else if (cmp > 0) {
      arr[k++] = mergeTemp[n1 + j];
      j++;
    } else {
      /* Same branch - sort by year */
      if (mergeTemp[i].year <= mergeTemp[n1 + j].year) {
        arr[k++] = mergeTemp[i++];
      } else {
        arr[k++] = mergeTemp[n1 + j];
        j++;
      }
    }
  }

  /* Copy remaining elements */
  while (i < n1)
    arr[k++] = mergeTemp[i++];
  while (j < n2) {
    arr[k++] = mergeTemp[n1 + j];
    j++;
  }
}

/*
 * mergeSort() - Divide and Conquer sorting
 * Splits array in half, sorts each half, then merges
 * Time Complexity: O(n log n)
 */
void mergeSort(Student arr[], int left, int right) {
  if (left < right) {
    int mid = left + (right - left) / 2;

    /* Divide: split into two halves */
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);

    /* Conquer: merge sorted halves */
    merge(arr, left, mid, right);
  }
}

/* =============================================
   INTERLEAVE BRANCHES - Graph Coloring Idea
   Arrange students so same branches don't sit next to each other
   Think of each branch as a "color" in graph coloring
   ============================================= */

/* Storage for interleaving - declared globally for old compilers */
static char branchNames[MAX_BRANCHES][MAX_BRANCH];
static int branchCounts[MAX_BRANCHES];
static Student branchGroups[MAX_BRANCHES][MAX_STUDENTS];
static int branchGroupSizes[MAX_BRANCHES];
static Student interleaveResult[MAX_STUDENTS];

/*
 * interleaveBranches() - Rearrange students array
 * so that adjacent students have different branches
 * This is the graph coloring concept:
 *   - Each branch = one color
 *   - Adjacent seats = adjacent nodes
 *   - No two adjacent nodes should have same color
 */
void interleaveBranches(Student arr[], int n) {
  int numBranches = 0;
  int i, j, b;
  int branchIdx[MAX_BRANCHES];
  int placed;

  /* Reset branch group sizes */
  memset(branchGroupSizes, 0, sizeof(branchGroupSizes));
  memset(branchCounts, 0, sizeof(branchCounts));

  /* Count students per branch */
  for (i = 0; i < n; i++) {
    int found = 0;
    for (j = 0; j < numBranches; j++) {
      if (strcmp(arr[i].branch, branchNames[j]) == 0) {
        branchCounts[j]++;
        found = 1;
        break;
      }
    }
    if (!found && numBranches < MAX_BRANCHES) {
      strcpy(branchNames[numBranches], arr[i].branch);
      branchCounts[numBranches] = 1;
      numBranches++;
    }
  }

  /* If only one branch, can't interleave - return as is */
  if (numBranches <= 1)
    return;

  /* Group students by branch */
  for (i = 0; i < n; i++) {
    for (j = 0; j < numBranches; j++) {
      if (strcmp(arr[i].branch, branchNames[j]) == 0) {
        branchGroups[j][branchGroupSizes[j]++] = arr[i];
        break;
      }
    }
  }

  /* Round-robin pick from each branch */
  memset(branchIdx, 0, sizeof(branchIdx));
  placed = 0;

  while (placed < n) {
    for (b = 0; b < numBranches && placed < n; b++) {
      if (branchIdx[b] < branchGroupSizes[b]) {
        interleaveResult[placed++] = branchGroups[b][branchIdx[b]++];
      }
    }
  }

  /* Copy back */
  for (i = 0; i < n; i++) {
    arr[i] = interleaveResult[i];
  }
}

/* =============================================
   CHECK CONFLICT - Used by backtracking
   ============================================= */

/*
 * hasConflict() - Check if two adjacent seats have conflict
 * Returns 1 if conflict exists, 0 otherwise
 */
int hasConflict(SeatAssignment *a, SeatAssignment *b, Rules *rules) {
  /* Same bench - check rules */
  if (strcmp(a->room_number, b->room_number) == 0 &&
      a->bench_number == b->bench_number) {

    /* Check same branch rule */
    if (!rules->allow_same_branch && strcmp(a->branch, b->branch) == 0) {
      return 1; /* Conflict! */
    }
  }
  return 0;
}

/* =============================================
   BACKTRACKING - Fix Conflicts
   If a student conflicts with neighbor, try swapping
   ============================================= */

/*
 * backtrackFix() - Try to resolve conflicts by swapping seats
 * Uses backtracking: try a swap, if it doesn't work, undo it
 * Returns number of conflicts fixed
 */
int backtrackFix(SeatAssignment seats[], int count, Rules *rules) {
  int fixed = 0;
  int i, j;
  SeatAssignment temp_seat;
  char tmpRoom[MAX_NAME];
  int tmpBench, tmpPos;

  for (i = 0; i < count - 1; i++) {
    /* Only check within same room, same bench */
    if (strcmp(seats[i].room_number, seats[i + 1].room_number) == 0 &&
        seats[i].bench_number == seats[i + 1].bench_number) {

      if (hasConflict(&seats[i], &seats[i + 1], rules)) {
        /* Try to find a non-conflicting swap */
        for (j = i + 2; j < count; j++) {
          /* Try swapping seats[i+1] with seats[j] */
          temp_seat = seats[i + 1];
          seats[i + 1] = seats[j];
          seats[j] = temp_seat;

          /* Update room/bench info for swapped seats */
          strcpy(tmpRoom, seats[i + 1].room_number);
          tmpBench = seats[i + 1].bench_number;
          tmpPos = seats[i + 1].seat_position;

          strcpy(seats[i + 1].room_number, seats[j].room_number);
          seats[i + 1].bench_number = seats[j].bench_number;
          seats[i + 1].seat_position = seats[j].seat_position;

          strcpy(seats[j].room_number, tmpRoom);
          seats[j].bench_number = tmpBench;
          seats[j].seat_position = tmpPos;

          /* Check if conflict is resolved */
          if (!hasConflict(&seats[i], &seats[i + 1], rules)) {
            fixed++;
            break; /* Success - keep the swap */
          }

          /* Backtrack - undo the swap */
          strcpy(tmpRoom, seats[i + 1].room_number);
          tmpBench = seats[i + 1].bench_number;
          tmpPos = seats[i + 1].seat_position;

          strcpy(seats[i + 1].room_number, seats[j].room_number);
          seats[i + 1].bench_number = seats[j].bench_number;
          seats[i + 1].seat_position = seats[j].seat_position;

          strcpy(seats[j].room_number, tmpRoom);
          seats[j].bench_number = tmpBench;
          seats[j].seat_position = tmpPos;

          temp_seat = seats[i + 1];
          seats[i + 1] = seats[j];
          seats[j] = temp_seat;
        }
      }
    }
  }
  return fixed;
}

/* =============================================
   GREEDY SEATING ASSIGNMENT
   Assign students to seats one by one, picking
   the best available seat each time
   ============================================= */

/*
 * greedyAssign() - Main seating algorithm
 * Goes through each room, each bench, each position
 * and assigns the next best student (greedy choice)
 */
void greedyAssign(Rules *rules) {
  int studentIdx = 0;
  int r, row, col, s;
  int benchNum;
  int seatsOnBench;

  num_assigned = 0;

  /* For each room (greedy: fill rooms one by one) */
  for (r = 0; r < num_rooms && studentIdx < num_students; r++) {
    benchNum = 1;

    /* For each row in the room */
    for (row = 0; row < rooms[r].rows && studentIdx < num_students; row++) {
      /* For each column (bench) in the row */
      for (col = 0; col < rooms[r].cols && studentIdx < num_students; col++) {
        /* Assign seats on this bench */
        seatsOnBench = rules->students_per_bench;

        for (s = 0; s < seatsOnBench && studentIdx < num_students; s++) {
          /* Create seat assignment */
          strcpy(seating[num_assigned].room_number, rooms[r].room_number);
          seating[num_assigned].bench_number = benchNum;
          seating[num_assigned].seat_position = s + 1;
          strcpy(seating[num_assigned].student_name, students[studentIdx].name);
          strcpy(seating[num_assigned].roll_number, students[studentIdx].roll);
          strcpy(seating[num_assigned].branch, students[studentIdx].branch);
          students[studentIdx].assigned = 1;

          num_assigned++;
          studentIdx++;
        }
        benchNum++;
      }
    }
  }
}

/* =============================================
   JSON PARSING (Simple manual parser)
   ============================================= */

/* Skip whitespace */
char *skipWhitespace(char *s) {
  while (*s == ' ' || *s == '\t' || *s == '\n' || *s == '\r')
    s++;
  return s;
}

/* Extract string value from JSON (simple parser) */
char *extractString(char *json, const char *key, char *value) {
  char searchKey[256];
  char *pos;
  int i;

  snprintf(searchKey, sizeof(searchKey), "\"%s\"", key);
  pos = strstr(json, searchKey);
  if (!pos) {
    value[0] = '\0';
    return json;
  }

  pos += strlen(searchKey);
  pos = skipWhitespace(pos);
  if (*pos == ':')
    pos++;
  pos = skipWhitespace(pos);

  if (*pos == '"') {
    pos++;
    i = 0;
    while (*pos && *pos != '"' && i < MAX_NAME - 1) {
      value[i++] = *pos++;
    }
    value[i] = '\0';
  }
  return pos;
}

/* Extract integer value from JSON */
int extractInt(char *json, const char *key) {
  char searchKey[256];
  char *pos;

  snprintf(searchKey, sizeof(searchKey), "\"%s\"", key);
  pos = strstr(json, searchKey);
  if (!pos)
    return 0;

  pos += strlen(searchKey);
  pos = skipWhitespace(pos);
  if (*pos == ':')
    pos++;
  pos = skipWhitespace(pos);

  return atoi(pos);
}

/* Parse the input JSON to extract students, rooms, and rules */
void parseInput(char *input) {
  char *studentsArr, *roomsArr;
  char *arrStart, *arrEnd, *pos, *objStart, *objEnd;
  char obj[2048];
  int len;

  /* Parse students array */
  studentsArr = strstr(input, "\"students\"");
  if (studentsArr) {
    arrStart = strchr(studentsArr, '[');
    if (arrStart) {
      pos = arrStart + 1;
      while (*pos && *pos != ']') {
        /* Find each student object */
        objStart = strchr(pos, '{');
        arrEnd = strchr(pos, ']');
        if (!objStart || (arrEnd && objStart > arrEnd))
          break;
        objEnd = strchr(objStart, '}');
        if (!objEnd)
          break;

        /* Extract from this object */
        len = (int)(objEnd - objStart + 1);
        if (len >= (int)sizeof(obj))
          len = sizeof(obj) - 1;
        strncpy(obj, objStart, len);
        obj[len] = '\0';

        extractString(obj, "name", students[num_students].name);
        extractString(obj, "roll", students[num_students].roll);
        extractString(obj, "branch", students[num_students].branch);
        students[num_students].year = extractInt(obj, "year");
        students[num_students].assigned = 0;
        num_students++;

        pos = objEnd + 1;
      }
    }
  }

  /* Parse rooms array */
  roomsArr = strstr(input, "\"rooms\"");
  if (roomsArr) {
    arrStart = strchr(roomsArr, '[');
    if (arrStart) {
      pos = arrStart + 1;
      while (*pos && *pos != ']') {
        objStart = strchr(pos, '{');
        if (!objStart)
          break;

        arrEnd = strchr(arrStart, ']');
        if (arrEnd && objStart > arrEnd)
          break;

        objEnd = strchr(objStart, '}');
        if (!objEnd)
          break;

        len = (int)(objEnd - objStart + 1);
        if (len >= (int)sizeof(obj))
          len = sizeof(obj) - 1;
        strncpy(obj, objStart, len);
        obj[len] = '\0';

        extractString(obj, "room_number", rooms[num_rooms].room_number);
        rooms[num_rooms].rows = extractInt(obj, "rows");
        rooms[num_rooms].cols = extractInt(obj, "cols");
        rooms[num_rooms].capacity =
            rooms[num_rooms].rows * rooms[num_rooms].cols;
        num_rooms++;

        pos = objEnd + 1;
      }
    }
  }
}

/* Parse rules from input */
Rules parseRules(char *input) {
  Rules rules;
  char *rulesObj, *objStart, *objEnd;
  char obj[1024];
  int len;

  rules.students_per_bench = 1;
  rules.allow_same_branch = 0;
  rules.allow_same_year = 0;

  rulesObj = strstr(input, "\"rules\"");
  if (rulesObj) {
    objStart = strchr(rulesObj, '{');
    if (objStart) {
      objEnd = strchr(objStart, '}');
      if (objEnd) {
        len = (int)(objEnd - objStart + 1);
        if (len >= (int)sizeof(obj))
          len = sizeof(obj) - 1;
        strncpy(obj, objStart, len);
        obj[len] = '\0';

        rules.students_per_bench = extractInt(obj, "students_per_bench");
        rules.allow_same_branch = extractInt(obj, "allow_same_branch");
        rules.allow_same_year = extractInt(obj, "allow_same_year");

        if (rules.students_per_bench < 1)
          rules.students_per_bench = 1;
        if (rules.students_per_bench > 2)
          rules.students_per_bench = 2;
      }
    }
  }
  return rules;
}

/* =============================================
   OUTPUT - Print seating plan as JSON
   ============================================= */
void printOutput(void) {
  int i;
  /* Calculate total capacity */
  int totalCapacity = 0;
  for (i = 0; i < num_rooms; i++) {
    totalCapacity += rooms[i].capacity;
  }

  printf("{");
  printf("\"seating\":[");
  for (i = 0; i < num_assigned; i++) {
    if (i > 0)
      printf(",");
    printf("{");
    printf("\"room_number\":\"%s\",", seating[i].room_number);
    printf("\"bench_number\":%d,", seating[i].bench_number);
    printf("\"seat_position\":%d,", seating[i].seat_position);
    printf("\"student_name\":\"%s\",", seating[i].student_name);
    printf("\"roll_number\":\"%s\",", seating[i].roll_number);
    printf("\"branch\":\"%s\"", seating[i].branch);
    printf("}");
  }
  printf("],");

  /* Stats */
  printf("\"stats\":{");
  printf("\"total_students\":%d,", num_students);
  printf("\"students_assigned\":%d,", num_assigned);
  printf("\"students_unassigned\":%d,", num_students - num_assigned);
  printf("\"total_rooms\":%d,", num_rooms);
  printf("\"total_capacity\":%d", totalCapacity);
  printf("}");
  printf("}");
}

/* =============================================
   MAIN FUNCTION
   ============================================= */
int main(void) {
  /* Read JSON input from stdin */
  char input[MAX_INPUT];
  int totalRead = 0;
  int bytesRead;
  Rules rules;

  while ((bytesRead = (int)fread(input + totalRead, 1,
                                 MAX_INPUT - totalRead - 1, stdin)) > 0) {
    totalRead += bytesRead;
  }
  input[totalRead] = '\0';

  /* Parse input data */
  parseInput(input);
  rules = parseRules(input);

  /*
   * STEP 1: Merge Sort (Divide & Conquer)
   * Sort students by branch and year for optimal distribution
   */
  if (num_students > 1) {
    mergeSort(students, 0, num_students - 1);
  }

  /*
   * STEP 2: Graph Coloring Idea
   * Interleave branches so same branch students don't sit next to each other
   */
  if (!rules.allow_same_branch) {
    interleaveBranches(students, num_students);
  }

  /*
   * STEP 3: Greedy Assignment
   * Assign students to seats greedily (fill one by one)
   */
  greedyAssign(&rules);

  /*
   * STEP 4: Backtracking
   * Fix any remaining conflicts by swapping seats
   */
  if (!rules.allow_same_branch) {
    backtrackFix(seating, num_assigned, &rules);
  }

  /* Output the result as JSON */
  printOutput();

  return 0;
}
