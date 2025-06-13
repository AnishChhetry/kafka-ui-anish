#!/bin/bash

# Function to handle script termination
cleanup() {
    echo "Shutting down applications..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set up trap for cleanup on script termination
trap cleanup SIGINT SIGTERM

# Start the backend
echo "Starting backend..."
cd backend
go run src/main.go &
BACKEND_PID=$!

# Start the frontend
echo "Starting frontend..."
cd ../web
npm install
npm start &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 