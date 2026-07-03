@echo off
REM Aiqan App — Quick Setup for Windows
echo =====================================
echo   أيقان - Aiqan App Setup
echo =====================================
echo.

REM 1. Frontend dependencies
echo [1/4] Installing frontend dependencies...
cd frontend
if not exist ".env" (
  copy .env.example .env >nul 2>&1
  echo        Created frontend/.env from .env.example
)
call npm install --legacy-peer-deps
cd ..
echo.

REM 2. Backend dependencies
echo [2/4] Installing backend dependencies...
cd backend
if not exist ".env" (
  copy .env.example .env >nul 2>&1
  echo        Created backend/.env from .env.example
)
call npm install
cd ..
echo.

REM 3. Start backend
echo [3/4] Starting backend server...
echo        Run this in a separate terminal:
echo        cd backend ^&^& npm run dev
echo.

REM 4. Start frontend
echo [4/4] Starting frontend (Expo)...
echo        Run this in a separate terminal:
echo        cd frontend ^&^& npx expo start
echo.
echo =====================================
echo Setup complete! See instructions above.
echo =====================================
pause
