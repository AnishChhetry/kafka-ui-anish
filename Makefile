# Kafka UI Project Makefile
# Cross-platform build and run commands

.PHONY: help setup install-deps install-go install-nodejs start start-backend start-frontend clean stop check-system

# Default target
help:
	@echo "Kafka UI Project - Available Commands:"
	@echo ""
	@echo "  make setup           - First-time setup (install dependencies)"
	@echo "  make start           - Start both backend and frontend"
	@echo "  make start-backend   - Start only the backend server"
	@echo "  make start-frontend  - Start only the frontend server"
	@echo "  make install-deps    - Install Go and Node.js dependencies"
	@echo "  make install-backend-deps - Install backend dependencies"
	@echo "  make install-frontend-deps - Install frontend dependencies"
	@echo "  make install-go      - Install Go programming language"
	@echo "  make install-nodejs  - Install Node.js and npm"
	@echo "  make clean           - Clean up temporary files and node_modules"
	@echo "  make stop            - Stop all running processes"
	@echo "  make check-system    - Check system requirements"
	@echo "  make help            - Show this help message"
	@echo ""

# Check if Go is installed
check-go:
	@echo "Checking Go installation..."
	@which go >/dev/null 2>&1 && (echo "✓ Go is installed"; go version) || (echo "✗ Go is not installed"; exit 1)

# Check if Node.js is installed
check-nodejs:
	@echo "Checking Node.js installation..."
	@which node >/dev/null 2>&1 && (echo "✓ Node.js is installed"; node --version; npm --version) || (echo "✗ Node.js is not installed"; exit 1)

# Install Go using available package manager
install-go:
	@echo "Installing Go..."
ifeq ($(OS),Windows_NT)
	@echo "Windows detected. Please install Go manually from https://golang.org/dl/"
	@echo "Or use: choco install golang -y (if Chocolatey is available)"
	@echo "Or use: scoop install go (if Scoop is available)"
	@exit 1
else
	@echo "Unix-like system detected. Attempting to install Go..."
	@which brew >/dev/null 2>&1 && (echo "Using Homebrew..."; brew install go) || \
	which apt-get >/dev/null 2>&1 && (echo "Using apt-get..."; sudo apt-get update && sudo apt-get install -y golang-go) || \
	which yum >/dev/null 2>&1 && (echo "Using yum..."; sudo yum install -y golang) || \
	which dnf >/dev/null 2>&1 && (echo "Using dnf..."; sudo dnf install -y golang) || \
	(echo "No supported package manager found. Please install Go manually from https://golang.org/dl/"; exit 1)
	@echo "Go installation completed."
endif

# Install Node.js using available package manager
install-nodejs:
	@echo "Installing Node.js..."
ifeq ($(OS),Windows_NT)
	@echo "Windows detected. Please install Node.js manually from https://nodejs.org/"
	@echo "Or use: choco install nodejs -y (if Chocolatey is available)"
	@echo "Or use: scoop install nodejs (if Scoop is available)"
	@exit 1
else
	@echo "Unix-like system detected. Attempting to install Node.js..."
	@which brew >/dev/null 2>&1 && (echo "Using Homebrew..."; brew install node@18 && brew link node@18 --force) || \
	which apt-get >/dev/null 2>&1 && (echo "Using NodeSource with apt-get..."; curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs) || \
	which yum >/dev/null 2>&1 && (echo "Using NodeSource with yum..."; curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && sudo yum install -y nodejs) || \
	which dnf >/dev/null 2>&1 && (echo "Using NodeSource with dnf..."; curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && sudo dnf install -y nodejs) || \
	(echo "No supported package manager found. Please install Node.js manually from https://nodejs.org/"; exit 1)
	@echo "Node.js installation completed."
endif

# Install all dependencies
install-deps: install-go install-nodejs
	@echo "All dependencies installed successfully!"

# Install backend dependencies
install-backend-deps: check-go
	@echo "Installing backend dependencies..."
	@cd backend && go mod tidy
	@echo "Backend dependencies installed."

# Install frontend dependencies
install-frontend-deps: check-nodejs
	@echo "Installing frontend dependencies..."
	@cd web && npm install --legacy-peer-deps
	@echo "Frontend dependencies installed."

# First-time setup - install everything
setup: install-deps install-backend-deps install-frontend-deps
	@echo ""
	@echo "=========================================="
	@echo "✓ Setup completed successfully!"
	@echo "=========================================="
	@echo ""
	@echo "You can now run: make start"
	@echo ""

# Start backend server (no installation)
start-backend:
	@echo "Starting backend server..."
	@cd backend && go run src/main.go

# Start frontend server (no installation)
start-frontend:
	@echo "Starting frontend server..."
	@cd web && npm start

# Start both servers (no installation)
start:
	@echo "Starting Kafka UI Project..."
	@echo "Backend will be available at: http://localhost:8080"
	@echo "Frontend will be available at: http://localhost:3000"
	@echo "Default credentials: admin / password"
	@echo ""
ifeq ($(OS),Windows_NT)
	@echo "Starting backend in new window..."
	@start "Kafka UI Backend" cmd /k "cd backend && go run src/main.go"
	@timeout /t 3 /nobreak >nul
	@echo "Starting frontend in new window..."
	@start "Kafka UI Frontend" cmd /k "cd web && npm start"
	@echo "Both servers started in separate windows."
	@echo "Close the windows to stop the servers."
else
	@echo "Starting backend in background..."
	@cd backend && go run src/main.go &
	@sleep 3
	@echo "Starting frontend in background..."
	@cd web && npm start &
	@echo "Both servers started in background."
	@echo "Press Ctrl+C to stop both servers."
	@wait
endif

# Stop all running processes
stop:
	@echo "Stopping all Kafka UI processes..."
ifeq ($(OS),Windows_NT)
	@taskkill /F /IM go.exe /T 2>nul || echo "No Go processes found"
	@taskkill /F /IM node.exe /T 2>nul || echo "No Node.js processes found"
else
	@echo "Stopping backend processes..."
	@pkill -f "go run src/main.go" 2>/dev/null || echo "No Go run processes found"
	@pkill -f "main" 2>/dev/null || echo "No main processes found"
	@echo "Stopping frontend processes..."
	@pkill -f "npm start" 2>/dev/null || echo "No npm start processes found"
	@pkill -f "react-scripts/scripts/start.js" 2>/dev/null || echo "No react-scripts processes found"
	@echo "Killing processes by port (fallback)..."
	@lsof -ti:8080 2>/dev/null | xargs kill -9 2>/dev/null || echo "No processes on port 8080"
	@lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || echo "No processes on port 3000"
endif
	@echo "All processes stopped."

# Clean up temporary files and dependencies
clean:
	@echo "Cleaning up..."
ifeq ($(OS),Windows_NT)
	@if exist web\node_modules rmdir /s /q web\node_modules
	@if exist backend\go.sum del backend\go.sum
else
	@rm -rf web/node_modules
	@rm -f backend/go.sum
endif
	@echo "Cleanup completed."

# Development helpers
dev-setup: install-deps install-backend-deps install-frontend-deps
	@echo "Development environment setup completed!"

# Quick start (assumes dependencies are already installed)
quick-start: install-backend-deps install-frontend-deps
	@echo "Quick starting Kafka UI Project..."
	@echo "Backend: http://localhost:8080"
	@echo "Frontend: http://localhost:3000"
	@echo "Credentials: admin / password"
ifeq ($(OS),Windows_NT)
	@start "Kafka UI Backend" cmd /k "cd backend && go run src/main.go"
	@timeout /t 2 /nobreak >nul
	@start "Kafka UI Frontend" cmd /k "cd web && npm start"
else
	@cd backend && go run src/main.go &
	@sleep 2
	@cd web && npm start &
	@wait
endif

# Check system requirements
check-system:
	@echo "Checking system requirements..."
ifeq ($(OS),Windows_NT)
	@echo "OS: Windows"
else
	@echo "OS: $(shell uname -s)"
	@echo "Architecture: $(shell uname -m)"
endif
	@echo ""
	@echo "Go:"
	@which go >/dev/null 2>&1 && echo "  ✓ Installed: $(shell go version)" || echo "  ✗ Not installed"
	@echo ""
	@echo "Node.js:"
	@which node >/dev/null 2>&1 && echo "  ✓ Installed: $(shell node --version)" || echo "  ✗ Not installed"
	@echo ""
	@echo "npm:"
	@which npm >/dev/null 2>&1 && echo "  ✓ Installed: $(shell npm --version)" || echo "  ✗ Not installed" 