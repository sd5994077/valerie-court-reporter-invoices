@echo off
echo ==========================================
echo   Invoice Database Cleanup Script
echo ==========================================
echo.
echo WARNING: This will DELETE ALL data in your database!
echo.
set /p confirm="Are you sure you want to continue? (type YES to confirm): "

if /i "%confirm%" NEQ "YES" (
    echo Cleanup cancelled.
    pause
    exit /b
)

echo.
echo Running pre-cleanup check...
psql %DATABASE_URL% -f check-database-content.sql

echo.
set /p final_confirm="Proceed with cleanup? (type DELETE to confirm): "

if /i "%final_confirm%" NEQ "DELETE" (
    echo Cleanup cancelled.
    pause
    exit /b
)

echo.
echo Running database cleanup...
psql %DATABASE_URL% -f cleanup-database.sql

echo.
echo Cleanup completed!
echo.
pause 