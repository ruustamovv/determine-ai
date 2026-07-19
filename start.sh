#!/bin/bash
echo "===================================="
echo "  Determine-AI - Starting..."
echo "===================================="
echo ""

DIR="$(cd "$(dirname "$0")" && pwd)"

# Kill any existing processes on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Start backend
echo "[1/3] Starting backend on port 8000..."
cd "$DIR"
python -m backend.main &
BACKEND_PID=$!
sleep 3

# Start frontend
echo "[2/3] Starting frontend on port 5173..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Start admin
echo "[3/3] Starting admin on port 5174..."
cd "$DIR/admin"
npm run dev &
ADMIN_PID=$!

echo ""
echo "===================================="
echo "  All services started!"
echo "===================================="
echo "  Backend:    http://localhost:8000"
echo "  Frontend:   http://localhost:5173"
echo "  Admin:      http://localhost:5174"
echo "===================================="
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID 2>/dev/null; echo 'All services stopped.'; exit 0" SIGINT SIGTERM
wait
