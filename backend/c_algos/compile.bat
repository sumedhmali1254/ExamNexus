@echo off
setlocal
echo ------------------------------------------
echo Smart Exam Seating Optimizer - Compiler
echo ------------------------------------------

rem Set local paths for MinGW
set PATH=C:\MinGW\bin;C:\MinGW\libexec\gcc\mingw32\6.3.0;%PATH%

echo [1/4] Compiling student_sorting.c...
gcc -std=c99 student_sorting.c -o student_sorting.exe
if %errorlevel% neq 0 (
    echo [ERROR] Failed to compile student_sorting.c.
    pause
    exit /b 1
)

echo [2/4] Compiling seating_generator.c...
gcc -std=c99 seating_generator.c -o seating_generator.exe
if %errorlevel% neq 0 (
    echo [ERROR] Failed to compile seating_generator.c.
    pause
    exit /b 1
)

echo [3/4] Compiling search.c...
gcc -std=c99 search.c -o search.exe
if %errorlevel% neq 0 (
    echo [ERROR] Failed to compile search.c.
    pause
    exit /b 1
)

echo [4/4] Compiling teacher_allocation.c...
gcc -std=c99 teacher_allocation.c -o teacher_allocation.exe
if %errorlevel% neq 0 (
    echo [ERROR] Failed to compile teacher_allocation.c.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] All 4 algorithms compiled successfully!
echo You can now start the backend server.
pause
endlocal
