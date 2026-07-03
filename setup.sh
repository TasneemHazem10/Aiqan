#!/usr/bin/env bash
# Aiqan App — Quick Setup for macOS/Linux
set -e

echo "====================================="
echo "  أيقان - Aiqan App Setup"
echo "====================================="
echo ""

# 1. Frontend dependencies
echo "[1/4] Installing frontend dependencies..."
cd frontend
if [ ! -f ".env" ]; then
  cp .env.example .env 2>/dev/null && echo "  Created frontend/.env from .env.example"
fi
npm install --legacy-peer-deps
cd ..
echo ""

# 2. Backend dependencies
echo "[2/4] Installing backend dependencies..."
cd backend
if [ ! -f ".env" ]; then
  cp .env.example .env 2>/dev/null && echo "  Created backend/.env from .env.example"
fi
npm install
cd ..
echo ""

# 3. Start backend
echo "[3/4] Starting backend server..."
echo "  Run this in a separate terminal:"
echo "  cd backend && npm run dev"
echo ""

# 4. Start frontend
echo "[4/4] Starting frontend (Expo)..."
echo "  Run this in a separate terminal:"
echo "  cd frontend && npx expo start"
echo ""
echo "====================================="
echo "Setup complete! See instructions above."
echo "====================================="
