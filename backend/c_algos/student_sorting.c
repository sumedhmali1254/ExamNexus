/*
 * =============================================
 * student_sorting.c - Merge Sort Engine
 * DAA Concept: Merge Sort O(n log n)
 * =============================================
 * Sorts students by department, year, division, roll
 * Input: JSON array via stdin
 * Output: Sorted JSON array via stdout
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_STUDENTS 5000
#define MAX_FIELD 256
#define MAX_INPUT 2000000

typedef struct {
    int id;
    char name[MAX_FIELD];
    char roll_number[MAX_FIELD];
    char branch[MAX_FIELD];
    int year;
    char division[16];
    char raw_json[1024];
} Student;

Student students[MAX_STUDENTS];
Student temp[MAX_STUDENTS];
int count = 0;

/* Extract a string field value from a JSON object string */
void extract_str(const char *json, const char *key, char *out, int maxlen) {
    char search[128];
    sprintf(search, "\"%s\":\"", key);
    const char *p = strstr(json, search);
    if (!p) { out[0] = '\0'; return; }
    p += strlen(search);
    int i = 0;
    while (*p && *p != '"' && i < maxlen - 1) {
        out[i++] = *p++;
    }
    out[i] = '\0';
}

/* Extract an integer field value from a JSON object string */
int extract_int(const char *json, const char *key) {
    char search[128];
    sprintf(search, "\"%s\":", key);
    const char *p = strstr(json, search);
    if (!p) return 0;
    p += strlen(search);
    while (*p == ' ') p++;
    return atoi(p);
}

/* Compare two students for sorting: branch -> year -> division -> roll */
int compare_students(const Student *a, const Student *b) {
    int c = strcmp(a->branch, b->branch);
    if (c != 0) return c;
    if (a->year != b->year) return a->year - b->year;
    c = strcmp(a->division, b->division);
    if (c != 0) return c;
    return strcmp(a->roll_number, b->roll_number);
}

/* Merge Sort - Merge step */
void merge(Student arr[], int l, int m, int r) {
    int i = l, j = m + 1, k = l;
    while (i <= m && j <= r) {
        if (compare_students(&arr[i], &arr[j]) <= 0)
            temp[k++] = arr[i++];
        else
            temp[k++] = arr[j++];
    }
    while (i <= m) temp[k++] = arr[i++];
    while (j <= r) temp[k++] = arr[j++];
    for (i = l; i <= r; i++) arr[i] = temp[i];
}

/* Merge Sort - Recursive divide */
void merge_sort(Student arr[], int l, int r) {
    if (l < r) {
        int m = l + (l + r) / 2;
        /* Fix: proper midpoint */
        m = (l + r) / 2;
        merge_sort(arr, l, m);
        merge_sort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}

int main(void) {
    char *input = (char*)malloc(MAX_INPUT);
    if (!input) return 1;

    size_t total = fread(input, 1, MAX_INPUT - 1, stdin);
    input[total] = '\0';

    /* Parse JSON objects */
    char *pos = input;
    char *objStart, *objEnd;
    while ((objStart = strchr(pos, '{')) != NULL) {
        objEnd = strchr(objStart, '}');
        if (!objEnd) break;
        size_t len = (size_t)(objEnd - objStart + 1);
        if (len < 1020 && count < MAX_STUDENTS) {
            memcpy(students[count].raw_json, objStart, len);
            students[count].raw_json[len] = '\0';
            students[count].id = extract_int(students[count].raw_json, "id");
            extract_str(students[count].raw_json, "name", students[count].name, MAX_FIELD);
            extract_str(students[count].raw_json, "roll_number", students[count].roll_number, MAX_FIELD);
            extract_str(students[count].raw_json, "branch", students[count].branch, MAX_FIELD);
            students[count].year = extract_int(students[count].raw_json, "year");
            extract_str(students[count].raw_json, "division", students[count].division, 16);
            count++;
        }
        pos = objEnd + 1;
    }

    /* Apply Merge Sort */
    if (count > 0) {
        merge_sort(students, 0, count - 1);
    }

    /* Output sorted JSON */
    printf("[");
    for (int i = 0; i < count; i++) {
        if (i > 0) printf(",");
        printf("%s", students[i].raw_json);
    }
    printf("]");

    free(input);
    return 0;
}
