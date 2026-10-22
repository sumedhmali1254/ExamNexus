#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_INPUT 1000000

char* my_strdup(const char* s) {
    size_t len = strlen(s) + 1;
    char* b = (char*)malloc(len);
    if (b) {
        memcpy(b, s, len);
    }
    return b;
}

void computeLPSArray(const char* pat, int M, int* lps) {
    int len = 0;
    lps[0] = 0;
    int i = 1;
    while (i < M) {
        if (pat[i] == pat[len]) {
            len++;
            lps[i] = len;
            i++;
        } else {
            if (len != 0) {
                len = lps[len - 1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }
}

int KMPSearch(const char* pat, const char* txt) {
    int M = (int)strlen(pat);
    int N = (int)strlen(txt);
    if (M == 0) return 1;

    char *lpat = my_strdup(pat);
    char *ltxt = my_strdup(txt);
    int i;
    for(i = 0; lpat[i]; i++) lpat[i] = (char)tolower((int)lpat[i]);
    for(i = 0; ltxt[i]; i++) ltxt[i] = (char)tolower((int)ltxt[i]);

    int *lps = (int*)malloc(sizeof(int) * M);
    computeLPSArray(lpat, M, lps);

    i = 0;
    int j = 0, found = 0;
    while (i < N) {
        if (lpat[j] == ltxt[i]) {
            j++; i++;
        }
        if (j == M) {
            found = 1; break;
        } else if (i < N && lpat[j] != ltxt[i]) {
            if (j != 0) j = lps[j - 1];
            else i = i + 1;
        }
    }
    free(lps); free(lpat); free(ltxt);
    return found;
}

int main(int argc, char *argv[]) {
    const char *query = (argc > 1) ? argv[1] : "All";
    const char *progFilter = (argc > 2) ? argv[2] : "All";
    const char *divFilter = (argc > 3) ? argv[3] : "All";

    char *input = (char*)malloc(MAX_INPUT);
    if (!input) return 1;

    size_t totalRead = fread(input, 1, MAX_INPUT - 1, stdin);
    input[totalRead] = '\0';

    printf("[");
    int first = 1;
    char *pos = input;
    char *objStart, *objEnd;

    while ((objStart = strchr(pos, '{')) != NULL) {
        objEnd = strchr(objStart, '}');
        if (!objEnd) break;

        size_t len = (size_t)(objEnd - objStart + 1);
        char *obj = (char*)malloc(len + 1);
        if (obj) {
            memcpy(obj, objStart, len);
            obj[len] = '\0';

            int qMatch = (strcmp(query, "All") == 0 || strcmp(query, "") == 0 || KMPSearch(query, obj));
            int pMatch = (strcmp(progFilter, "All") == 0 || KMPSearch(progFilter, obj));
            int dMatch = (strcmp(divFilter, "All") == 0 || KMPSearch(divFilter, obj));

            if (qMatch && pMatch && dMatch) {
                if (!first) printf(",");
                printf("%s", obj);
                first = 0;
            }
            free(obj);
        }
        pos = objEnd + 1;
    }
    printf("]");
    free(input);
    return 0;
}
