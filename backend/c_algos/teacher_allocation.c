/*
 * =============================================
 * Smart Exam Seating Optimizer
 * teacher_allocation.c - Teacher Room Allocation
 * =============================================
 *
 * DAA Concepts Used:
 * 1. Greedy Algorithm - Assign teachers to rooms one by one
 * 2. Conflict Checking - Ensure no teacher is in two rooms at once
 *
 * Input:  JSON via stdin (teachers, rooms)
 * Output: JSON via stdout (teacher-room allocation)
 *
 * Compile: gcc teacher_allocation.c -o teacher_allocation.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* =============================================
   Constants
   ============================================= */
#define MAX_TEACHERS 100
#define MAX_ROOMS 50
#define MAX_NAME 100
#define MAX_DEPT 50
#define MAX_INPUT 50000

/* =============================================
   Data Structures
   ============================================= */

/* Teacher structure */
typedef struct {
    char name[MAX_NAME];
    char department[MAX_DEPT];
    int assigned;               /* 0 = not assigned, 1 = assigned */
} Teacher;

/* Room structure */
typedef struct {
    char room_number[MAX_NAME];
    int has_teacher;            /* 0 = no teacher, 1 = teacher assigned */
} Room;

/* Allocation result */
typedef struct {
    char room_number[MAX_NAME];
    char teacher_name[MAX_NAME];
    char department[MAX_DEPT];
} Allocation;

/* =============================================
   Global Variables
   ============================================= */
Teacher teachers[MAX_TEACHERS];
Room rooms[MAX_ROOMS];
Allocation allocation[MAX_ROOMS];
int num_teachers = 0;
int num_rooms = 0;
int num_allocated = 0;

/* =============================================
   JSON PARSING (Simple manual parser)
   ============================================= */

/* Skip whitespace in JSON */
char* skipWS(char *s) {
    while (*s == ' ' || *s == '\t' || *s == '\n' || *s == '\r') s++;
    return s;
}

/* Extract a string value for a given key */
void getStringVal(char *obj, const char *key, char *value) {
    char searchKey[256];
    char *pos;
    int i;

    snprintf(searchKey, sizeof(searchKey), "\"%s\"", key);
    pos = strstr(obj, searchKey);
    if (!pos) { value[0] = '\0'; return; }
    
    pos += strlen(searchKey);
    pos = skipWS(pos);
    if (*pos == ':') pos++;
    pos = skipWS(pos);
    
    if (*pos == '"') {
        pos++;
        i = 0;
        while (*pos && *pos != '"' && i < MAX_NAME - 1) {
            value[i++] = *pos++;
        }
        value[i] = '\0';
    }
}

/* Parse all input data */
void parseInput(char *input) {
    char *teachersArr, *roomsArr;
    char *arrStart, *arrEnd, *pos, *objStart, *objEnd;
    char obj[1024];
    int len;

    /* Parse teachers array */
    teachersArr = strstr(input, "\"teachers\"");
    if (teachersArr) {
        arrStart = strchr(teachersArr, '[');
        if (arrStart) {
            pos = arrStart + 1;
            while (*pos) {
                objStart = strchr(pos, '{');
                if (!objStart) break;
                
                /* Check if we've gone past the array end */
                arrEnd = strchr(arrStart, ']');
                if (arrEnd && objStart > arrEnd) break;
                
                objEnd = strchr(objStart, '}');
                if (!objEnd) break;

                len = (int)(objEnd - objStart + 1);
                if (len >= (int)sizeof(obj)) len = sizeof(obj) - 1;
                strncpy(obj, objStart, len);
                obj[len] = '\0';

                getStringVal(obj, "name", teachers[num_teachers].name);
                getStringVal(obj, "department", teachers[num_teachers].department);
                teachers[num_teachers].assigned = 0;
                num_teachers++;

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
            while (*pos) {
                objStart = strchr(pos, '{');
                if (!objStart) break;
                
                arrEnd = strchr(arrStart, ']');
                if (arrEnd && objStart > arrEnd) break;
                
                objEnd = strchr(objStart, '}');
                if (!objEnd) break;

                len = (int)(objEnd - objStart + 1);
                if (len >= (int)sizeof(obj)) len = sizeof(obj) - 1;
                strncpy(obj, objStart, len);
                obj[len] = '\0';

                getStringVal(obj, "room_number", rooms[num_rooms].room_number);
                rooms[num_rooms].has_teacher = 0;
                num_rooms++;

                pos = objEnd + 1;
            }
        }
    }
}

/* =============================================
   GREEDY TEACHER ALLOCATION
   =============================================
   
   Strategy (Greedy):
   - For each room, pick the best available teacher
   - "Best" = teacher from a different department than
     the previously assigned teacher (for diversity)
   - If no different-department teacher available,
     pick any available teacher
   
   Conflict Checking:
   - Each teacher can only be assigned to ONE room
   - Once assigned, mark teacher as unavailable
   ============================================= */

/*
 * greedyAllocate() - Assign teachers to rooms
 * 
 * Greedy choice: For each room, find the first available
 * teacher whose department differs from the last assigned
 * teacher's department (for variety/fairness).
 */
void greedyAllocate(void) {
    char lastDept[MAX_DEPT] = "";  /* Track last assigned department */
    int r, t;
    int bestTeacher;

    num_allocated = 0;

    /* For each room, find the best teacher */
    for (r = 0; r < num_rooms; r++) {
        bestTeacher = -1;

        /*
         * GREEDY CHOICE 1: Try to find a teacher from a 
         * different department than the last one assigned
         * This ensures diversity in room supervision
         */
        for (t = 0; t < num_teachers; t++) {
            if (!teachers[t].assigned) {
                /* Prefer teacher from different department */
                if (strcmp(teachers[t].department, lastDept) != 0) {
                    bestTeacher = t;
                    break;
                }
            }
        }

        /*
         * GREEDY CHOICE 2: If no different-department teacher,
         * just pick any available teacher (fallback)
         */
        if (bestTeacher == -1) {
            for (t = 0; t < num_teachers; t++) {
                if (!teachers[t].assigned) {
                    bestTeacher = t;
                    break;
                }
            }
        }

        /* Assign the teacher to the room */
        if (bestTeacher != -1) {
            /* Conflict check: teacher must not be already assigned */
            teachers[bestTeacher].assigned = 1;  /* Mark as assigned */
            rooms[r].has_teacher = 1;

            strcpy(allocation[num_allocated].room_number, rooms[r].room_number);
            strcpy(allocation[num_allocated].teacher_name, teachers[bestTeacher].name);
            strcpy(allocation[num_allocated].department, teachers[bestTeacher].department);
            strcpy(lastDept, teachers[bestTeacher].department);

            num_allocated++;
        }
        /* If no teacher available, room goes unassigned */
    }
}

/* =============================================
   OUTPUT - Print allocation as JSON
   ============================================= */
void printOutput(void) {
    int i, t;
    int unassignedRooms, unassignedTeachers;

    printf("{");
    printf("\"allocation\":[");
    for (i = 0; i < num_allocated; i++) {
        if (i > 0) printf(",");
        printf("{");
        printf("\"room_number\":\"%s\",", allocation[i].room_number);
        printf("\"teacher_name\":\"%s\",", allocation[i].teacher_name);
        printf("\"department\":\"%s\"", allocation[i].department);
        printf("}");
    }
    printf("],");

    /* Stats */
    unassignedRooms = num_rooms - num_allocated;
    unassignedTeachers = 0;
    for (t = 0; t < num_teachers; t++) {
        if (!teachers[t].assigned) unassignedTeachers++;
    }

    printf("\"stats\":{");
    printf("\"total_teachers\":%d,", num_teachers);
    printf("\"total_rooms\":%d,", num_rooms);
    printf("\"rooms_assigned\":%d,", num_allocated);
    printf("\"rooms_unassigned\":%d,", unassignedRooms);
    printf("\"teachers_unassigned\":%d", unassignedTeachers);
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

    while ((bytesRead = (int)fread(input + totalRead, 1, MAX_INPUT - totalRead - 1, stdin)) > 0) {
        totalRead += bytesRead;
    }
    input[totalRead] = '\0';

    /* Parse input data */
    parseInput(input);

    /*
     * Run Greedy Allocation with Conflict Checking
     * - Each teacher assigned to at most one room
     * - Diversity preferred (different departments for adjacent rooms)
     */
    greedyAllocate();

    /* Output the result as JSON */
    printOutput();

    return 0;
}
