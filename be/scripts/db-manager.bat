@echo off
REM Database management script for Windows

setlocal enabledelayedexpansion

set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Docker is not running. Please start Docker and try again.
    exit /b 1
)
goto :eof

:start_databases
echo %BLUE%=== Starting Database Services ===%NC%
call :check_docker

echo %GREEN%[INFO]%NC% Starting PostgreSQL, MongoDB, and Redis...
docker-compose up -d postgres mongodb redis

echo %GREEN%[INFO]%NC% Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

echo %GREEN%[INFO]%NC% Database URLs:
echo   PostgreSQL: postgresql://postgres:password@localhost:5432/dev_chat
echo   MongoDB: mongodb://admin:password@localhost:27017/dev_chat
echo   Redis: redis://localhost:6379 (password: redispassword)
goto :eof

:start_with_admin
echo %BLUE%=== Starting Database Services with Admin Tools ===%NC%
call :check_docker

echo %GREEN%[INFO]%NC% Starting all services including admin tools...
docker-compose up -d

echo %GREEN%[INFO]%NC% Waiting for services to be healthy...
timeout /t 15 /nobreak >nul

echo %GREEN%[INFO]%NC% All services started! Access admin tools at:
echo   pgAdmin: http://localhost:8080 (admin@devchat.local / password)
echo   Mongo Express: http://localhost:8081 (admin / password)
goto :eof

:stop_databases
echo %BLUE%=== Stopping Database Services ===%NC%
call :check_docker

echo %GREEN%[INFO]%NC% Stopping all services...
docker-compose down

echo %GREEN%[INFO]%NC% All services stopped!
goto :eof

:show_status
echo %BLUE%=== Database Services Status ===%NC%
call :check_docker

echo Service Status:
docker-compose ps
goto :eof

:show_logs
echo %BLUE%=== Database Services Logs ===%NC%
call :check_docker

if "%~2"=="" (
    echo %GREEN%[INFO]%NC% Showing logs for all services...
    docker-compose logs -f
) else (
    echo %GREEN%[INFO]%NC% Showing logs for %~2...
    docker-compose logs -f %~2
)
goto :eof

:show_help
echo %BLUE%=== Database Management Script Help ===%NC%
echo Usage: npm run db:^<command^>
echo.
echo Available commands:
echo   start       - Start database services (PostgreSQL, MongoDB, Redis)
echo   start:admin - Start database services with admin tools
echo   stop        - Stop all database services
echo   status      - Show status of all services
echo   logs [svc]  - Show logs for all services or specific service
echo   help        - Show this help message
echo.
echo Examples:
echo   npm run db:start
echo   npm run db:logs postgres
goto :eof

if "%~1"=="start" (
    call :start_databases
) else if "%~1"=="start:admin" (
    call :start_with_admin
) else if "%~1"=="stop" (
    call :stop_databases
) else if "%~1"=="status" (
    call :show_status
) else if "%~1"=="logs" (
    call :show_logs %~1 %~2
) else if "%~1"=="help" (
    call :show_help
) else if "%~1"=="--help" (
    call :show_help
) else if "%~1"=="-h" (
    call :show_help
) else (
    echo %RED%[ERROR]%NC% Unknown command: %~1
    call :show_help
    exit /b 1
)
