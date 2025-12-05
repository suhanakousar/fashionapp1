@echo off
echo Starting StyleWeave Backend...
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env from template...
    copy .env.example .env
    echo Please edit .env with your credentials!
    pause
)

REM Start MongoDB (if not running)
echo Checking MongoDB...
docker ps | findstr mongo >nul
if %errorlevel% neq 0 (
    echo Starting MongoDB container...
    docker run -d -p 27017:27017 --name styleweave_mongo mongo:6
)

REM Start Redis (if not running)
echo Checking Redis...
docker ps | findstr redis >nul
if %errorlevel% neq 0 (
    echo Starting Redis container...
    docker run -d -p 6379:6379 --name styleweave_redis redis:7-alpine
)

REM Start API
echo.
echo Starting FastAPI server...
cd api
python -m uvicorn app:app --reload --port 8000
pause

