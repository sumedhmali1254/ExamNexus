/*
 * =============================================
 * seating_generator.c - Core Seating Engine
 * DAA Concepts: Greedy + Backtracking + Graph Coloring
 * =============================================
 *
 * Input via stdin: JSON with keys:
 *   students, rooms, rules
 * Output via stdout: JSON array of assignments
 *
 * Algorithm:
 *   1. Parse students (pre-sorted by student_sorting)
 *   2. Parse rooms and rules
 *   3. Greedy assign students to benches
 *   4. Backtrack on rule violations
 *   5. Output seat assignments
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_STUDENTS 5000
#define MAX_ROOMS 100
#define MAX_BENCHES 2000
#define MAX_FIELD 256

typedef struct {
  int id;
  char name[MAX_FIELD];
  char roll_number[MAX_FIELD];
  char branch[MAX_FIELD];
  int year;
  char division[16];
} Student;

typedef struct {
  int id;
  char room_number[64];
  int num_rows;
  int num_columns;
  int capacity;
} Room;

typedef struct {
  int candidates_per_bench;
  int prevent_same_department_bench;
  int prevent_same_year_bench;
  int randomized_seating;
  int max_departments_per_room;
  int max_years_per_room;
} SeatingRules;

typedef struct {
  int room_id;
  int bench_number;
  int seat_position;
  int student_id;
  char student_name[MAX_FIELD];
  char roll_number[MAX_FIELD];
  char branch[MAX_FIELD];
  int year;
  char division[16];
  char room_number[64];
} Assignment;

Student students[MAX_STUDENTS];
Room rooms[MAX_ROOMS];
Assignment assignments[MAX_STUDENTS];
int student_count = 0, room_count = 0, assign_count = 0;
SeatingRules rules;

void extract_str(const char *json, const char *key, char *out, int maxlen) {
  char search[128];
  sprintf(search, "\"%s\":\"", key);
  const char *p = strstr(json, search);
  if (!p) {
    out[0] = '\0';
    return;
  }
  p += strlen(search);
  int i = 0;
  while (*p && *p != '"' && i < maxlen - 1)
    out[i++] = *p++;
  out[i] = '\0';
}

int extract_int(const char *json, const char *key) {
  char search[128];
  sprintf(search, "\"%s\":", key);
  const char *p = strstr(json, search);
  if (!p)
    return 0;
  p += strlen(search);
  while (*p == ' ')
    p++;
  return atoi(p);
}

/* Rule checker: Can student sit at this position? */
int check_rules(int room_idx, int bench, int seat, int student_idx) {
  Student *s = &students[student_idx];

  /* Check same bench rules */
  for (int i = 0; i < assign_count; i++) {
    if (assignments[i].room_id != rooms[room_idx].id)
      continue;
    if (assignments[i].bench_number != bench)
      continue;

    /* Same dept on same bench */
    if (rules.prevent_same_department_bench &&
        strcmp(assignments[i].branch, s->branch) == 0)
      return 0;
    /* Same year on same bench */
    if (rules.prevent_same_year_bench && assignments[i].year == s->year)
      return 0;
  }

  /* Check room-level dept/year limits */
  int dept_count = 0, year_count = 0;
  char seen_depts[50][MAX_FIELD];
  int sd = 0;
  int seen_years[10];
  int sy = 0;
  int found;

  for (int i = 0; i < assign_count; i++) {
    if (assignments[i].room_id != rooms[room_idx].id)
      continue;
    found = 0;
    for (int j = 0; j < sd; j++) {
      if (strcmp(seen_depts[j], assignments[i].branch) == 0) {
        found = 1;
        break;
      }
    }
    if (!found && sd < 50)
      strcpy(seen_depts[sd++], assignments[i].branch);

    found = 0;
    for (int j = 0; j < sy; j++) {
      if (seen_years[j] == assignments[i].year) {
        found = 1;
        break;
      }
    }
    if (!found && sy < 10)
      seen_years[sy++] = assignments[i].year;
  }

  /* Check if adding this student would exceed limits */
  found = 0;
  for (int j = 0; j < sd; j++) {
    if (strcmp(seen_depts[j], s->branch) == 0) {
      found = 1;
      break;
    }
  }
  if (!found && sd >= rules.max_departments_per_room)
    return 0;

  found = 0;
  for (int j = 0; j < sy; j++) {
    if (seen_years[j] == s->year) {
      found = 1;
      break;
    }
  }
  if (!found && sy >= rules.max_years_per_room)
    return 0;

  return 1;
}

void parse_section(const char *input, const char *section_key, char *out,
                   int maxlen) {
  char search[64];
  sprintf(search, "\"%s\":[", section_key);
  const char *start = strstr(input, search);
  if (!start) {
    out[0] = '\0';
    return;
  }
  start = strchr(start, '[');
  int depth = 0;
  int i = 0;
  while (start[i] && i < maxlen - 1) {
    if (start[i] == '[')
      depth++;
    if (start[i] == ']')
      depth--;
    out[i] = start[i];
    i++;
    if (depth == 0)
      break;
  }
  out[i] = '\0';
}

void parse_students(const char *json) {
  char *pos = (char *)json;
  char *objStart, *objEnd;
  while ((objStart = strchr(pos, '{')) != NULL) {
    objEnd = strchr(objStart, '}');
    if (!objEnd)
      break;
    size_t len = (size_t)(objEnd - objStart + 1);
    char obj[1024];
    if (len < 1020) {
      memcpy(obj, objStart, len);
      obj[len] = '\0';
      students[student_count].id = extract_int(obj, "id");
      extract_str(obj, "name", students[student_count].name, MAX_FIELD);
      extract_str(obj, "roll_number", students[student_count].roll_number,
                  MAX_FIELD);
      extract_str(obj, "branch", students[student_count].branch, MAX_FIELD);
      students[student_count].year = extract_int(obj, "year");
      extract_str(obj, "division", students[student_count].division, 16);
      student_count++;
    }
    pos = objEnd + 1;
  }
}

void parse_rooms(const char *json) {
  char *pos = (char *)json;
  char *objStart, *objEnd;
  while ((objStart = strchr(pos, '{')) != NULL) {
    objEnd = strchr(objStart, '}');
    if (!objEnd)
      break;
    size_t len = (size_t)(objEnd - objStart + 1);
    char obj[512];
    if (len < 510) {
      memcpy(obj, objStart, len);
      obj[len] = '\0';
      rooms[room_count].id = extract_int(obj, "id");
      extract_str(obj, "room_number", rooms[room_count].room_number, 64);
      rooms[room_count].num_rows = extract_int(obj, "num_rows");
      rooms[room_count].num_columns = extract_int(obj, "num_columns");
      rooms[room_count].capacity =
          rooms[room_count].num_rows * rooms[room_count].num_columns * 2;
      room_count++;
    }
    pos = objEnd + 1;
  }
}

void parse_rules(const char *input) {
  /* Find the rules object */
  const char *rStart = strstr(input, "\"rules\":{");
  if (!rStart) {
    /* Defaults */
    rules.candidates_per_bench = 2;
    rules.prevent_same_department_bench = 1;
    rules.prevent_same_year_bench = 1;
    rules.max_departments_per_room = 4;
    rules.max_years_per_room = 2;
    rules.randomized_seating = 1;
    return;
  }
  char *objEnd = strchr(rStart + 8, '}');
  if (!objEnd)
    return;
  size_t len = (size_t)(objEnd - rStart + 1);
  char robj[512];
  memcpy(robj, rStart, len);
  robj[len] = '\0';

  rules.candidates_per_bench = extract_int(robj, "seats_per_bench");
  if (rules.candidates_per_bench == 0)
    rules.candidates_per_bench = 2;
  
  rules.prevent_same_department_bench = (extract_int(robj, "same_dept_same_bench") == 0) ? 1 : 0;
  rules.prevent_same_year_bench = (extract_int(robj, "same_year_same_bench") == 0) ? 1 : 0;
  
  rules.max_departments_per_room = extract_int(robj, "max_depts_per_room");
  if (rules.max_departments_per_room == 0)
    rules.max_departments_per_room = 4;
    
  rules.max_years_per_room = extract_int(robj, "max_years_per_room");
  if (rules.max_years_per_room == 0)
    rules.max_years_per_room = 2;
    
  char rpref[64];
  extract_str(robj, "roll_preference", rpref, 64);
  rules.randomized_seating = (strcmp(rpref, "no_preference") == 0) ? 1 : 0;
}

int main(void) {
  char *input = (char *)malloc(4000000);
  if (!input)
    return 1;
  size_t total = fread(input, 1, 3999999, stdin);
  input[total] = '\0';

  /* Parse sections */
  char *students_json = (char *)malloc(2000000);
  char *rooms_json = (char *)malloc(500000);

  parse_section(input, "students", students_json, 2000000);
  parse_section(input, "rooms", rooms_json, 500000);
  parse_rules(input);

  parse_students(students_json);
  parse_rooms(rooms_json);

  /* SEATED ALGORITHM:
     If randomized_seating is 1, shuffle students for anti-cheating
  */
  if (rules.randomized_seating) {
    srand(students[0].id + student_count); // Simple seed
    for (int i = 0; i < student_count - 1; i++) {
      int j = i + rand() / (RAND_MAX / (student_count - i) + 1);
      Student t = students[i];
      students[i] = students[j];
      students[j] = t;
    }
  }

  int seated = 0;
  int si = 0; /* Student index */

  for (int ri = 0; ri < room_count && si < student_count; ri++) {
    int total_benches = rooms[ri].num_rows * rooms[ri].num_columns;
    int seats_per_bench = rules.candidates_per_bench;

    /* Anti-cheating: try to spread departments as much as possible
       Logic: fill column by column (vertical sequence first)
    */
    for (int col = 1; col <= rooms[ri].num_columns && si < student_count; col++) {
      for (int row = 1; row <= rooms[ri].num_rows && si < student_count; row++) {
        int b = (row - 1) * rooms[ri].num_columns + col;
        for (int s = 1; s <= seats_per_bench && si < student_count; s++) {
          /* Greedy: try current student */
          if (check_rules(ri, b, s, si)) {
            assignments[assign_count].room_id = rooms[ri].id;
            assignments[assign_count].bench_number = b;
            assignments[assign_count].seat_position = s;
            assignments[assign_count].student_id = students[si].id;
            strcpy(assignments[assign_count].student_name, students[si].name);
            strcpy(assignments[assign_count].roll_number, students[si].roll_number);
            strcpy(assignments[assign_count].branch, students[si].branch);
            assignments[assign_count].year = students[si].year;
            strcpy(assignments[assign_count].division, students[si].division);
            strcpy(assignments[assign_count].room_number, rooms[ri].room_number);
            assign_count++;
            seated++;
            si++;
        } else {
          /* Backtracking: try next student that fits */
          int found = 0;
          for (int k = si + 1; k < student_count && k < si + 20; k++) {
            if (check_rules(ri, b, s, k)) {
              /* Swap students */
              Student tmp = students[si];
              students[si] = students[k];
              students[k] = tmp;
              /* Now assign */
              assignments[assign_count].room_id = rooms[ri].id;
              assignments[assign_count].bench_number = b;
              assignments[assign_count].seat_position = s;
              assignments[assign_count].student_id = students[si].id;
              strcpy(assignments[assign_count].student_name, students[si].name);
              strcpy(assignments[assign_count].roll_number,
                     students[si].roll_number);
              strcpy(assignments[assign_count].branch, students[si].branch);
              assignments[assign_count].year = students[si].year;
              strcpy(assignments[assign_count].division, students[si].division);
              strcpy(assignments[assign_count].room_number,
                     rooms[ri].room_number);
              assign_count++;
              seated++;
              si++;
              found = 1;
              break;
            }
          }
          if (!found) {
            /* Skip seat if no student fits (relaxed backtracking) */
          }
        }
      }
    }
  }
}

  /* Output JSON */
  printf("{\"seated\":%d,\"total\":%d,\"assignments\":[", seated,
         student_count);
  for (int i = 0; i < assign_count; i++) {
    if (i > 0)
      printf(",");
    printf("{\"room_id\":%d,\"room_number\":\"%s\",\"bench_number\":%d,\"seat_"
           "position\":%d,"
           "\"student_id\":%d,\"student_name\":\"%s\",\"roll_number\":\"%s\","
           "\"branch\":\"%s\",\"year\":%d,\"division\":\"%s\"}",
           assignments[i].room_id, assignments[i].room_number,
           assignments[i].bench_number, assignments[i].seat_position,
           assignments[i].student_id, assignments[i].student_name,
           assignments[i].roll_number, assignments[i].branch,
           assignments[i].year, assignments[i].division);
  }
  printf("]}");

  free(input);
  free(students_json);
  free(rooms_json);
  return 0;
}
