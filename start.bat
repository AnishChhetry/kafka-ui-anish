@echo off
echo Starting Kafka UI applications...

:: Start the backend
echo Starting backend...
cd backend
start cmd /k "go run src/main.go"

:: Start the frontend
echo Starting frontend...
cd ..\web
start cmd /k "npm install && npm start"

echo Both applications are starting...
echo Press Ctrl+C in each window to stop the applications 