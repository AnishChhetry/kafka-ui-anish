# Kafka UI Project

## Overview
This project provides a web-based UI for managing and monitoring Apache Kafka clusters. It consists of a Go-based backend API and a React-based frontend. The backend handles Kafka operations and authentication, while the frontend offers a modern, user-friendly interface for interacting with Kafka topics, messages, brokers, and consumers.

## Project Structure

```
├── backend/         # Go backend API for Kafka operations and authentication
│   ├── api/         # API route handlers (topics, messages, brokers, auth)
│   ├── kafka/       # Kafka client logic and interfaces
│   ├── middleware/  # JWT authentication middleware
│   ├── models/      # Data models (e.g., Topic)
│   ├── utils/       # Utility functions (CSV user management, responses)
│   ├── data/        # User data (users.csv)
│   └── src/         # Main entry point (main.go)
├── web/             # React frontend
│   ├── src/         # Source code (components, contexts, main app)
│   ├── public/      # Static assets
│   └── ...          # Config files, dependencies
├── start.sh         # Shell script to start backend and frontend
├── start.bat        # Batch script to start backend and frontend (Windows)
└── README.md        # Project documentation
```

## Backend (Go)
- **API Endpoints:**
  - `/api/login` – JWT login
  - `/api/check-connection` – Kafka connection check
  - `/api/topics` – List topics
  - `/api/topics/:name/messages` – Get messages
  - `/api/topics/:name/partitions` – Partition info
  - `/api/produce` – Produce message
  - `/api/topics/:name/messages` (DELETE) – Delete all messages
  - `/api/topics/:name` (DELETE) – Delete topic
  - `/api/topics` (POST) – Create topic
  - `/api/consumers` – List consumers
  - `/api/brokers` – List brokers
  - `/api/change-password` – Change user password
- **Authentication:** JWT-based, user data stored in `backend/data/users.csv`.
- **Kafka Integration:** Uses `confluent-kafka-go` for all Kafka operations.
- **Config:**
  - Server port via `PORT` env var (default: `8080`)
  - Kafka broker address is configured dynamically via `bootstrapServer` query parameter
  - CORS is configured to allow requests from `http://localhost:3000`
  - Protected routes require JWT authentication and bootstrap server configuration

## Frontend (React)
- **Main Features:**
  - Login/logout with JWT
  - Dynamic Kafka broker configuration
  - View, create, and delete topics
  - View and produce messages
  - View brokers and consumers
  - Change password
- **Tech Stack:** React, Material UI, Axios
- **Start:**
  - `npm install` in `web/`
  - `npm start` in `web/` (runs on [http://localhost:3000](http://localhost:3000))

## Prerequisites

### System Requirements
- **Operating Systems:** Windows 10/11, macOS 10.15+, Linux (Ubuntu 18.04+, CentOS 7+)
- **RAM:** 4GB minimum (8GB recommended)
- **Storage:** 1GB free space
- **Network:** Stable internet connection for Kafka cluster access

### Required Software
- **Go:** 1.24.1 or later
- **Node.js:** 18.0.0 or later (LTS recommended)
- **npm:** 8.0.0 or later (comes with Node.js)
- **Git:** 2.30.0 or later (optional but recommended)

## Installation & Setup

### 🪟 Windows Installation

#### 1. Install Required Software

**Install Go:**
1. Download Go from [golang.org/dl/](https://golang.org/dl/)
2. Run the installer and follow the setup wizard
3. Verify installation: Open Command Prompt and run `go version`

**Install Node.js:**
1. Download Node.js LTS from [nodejs.org/](https://nodejs.org/)
2. Run the installer and follow the setup wizard
3. Verify installation: Open Command Prompt and run `node --version` and `npm --version`

**Install Git (Optional):**
1. Download Git from [git-scm.com/](https://git-scm.com/)
2. Run the installer with default settings
3. Verify installation: Open Command Prompt and run `git --version`

#### 2. Clone and Setup Project

```cmd
# Clone the repository (if using Git)
git clone <repository-url>
cd kafka-ui-anish-main

# Or download and extract the ZIP file
# Navigate to the project directory in Command Prompt
```

#### 3. Quick Start (Recommended)

**Option A: Using the provided Windows script**
```cmd
# Double-click start.bat or run in Command Prompt
start.bat
```

**Option B: Manual startup**
```cmd
# Terminal 1 - Backend
cd backend
go mod tidy
go run src/main.go

# Terminal 2 - Frontend (open new Command Prompt)
cd web
npm install
npm start
```

### 🍎 macOS Installation

#### 1. Install Required Software

**Using Homebrew (Recommended):**
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required software
brew install go node git
```

**Manual Installation:**
- **Go:** Download from [golang.org/dl/](https://golang.org/dl/)
- **Node.js:** Download from [nodejs.org/](https://nodejs.org/)
- **Git:** Download from [git-scm.com/](https://git-scm.com/)

#### 2. Clone and Setup Project

```bash
# Clone the repository
git clone <repository-url>
cd kafka-ui-anish-main
```

#### 3. Quick Start (Recommended)

**Option A: Using the provided shell script**
```bash
# Make the script executable (first time only)
chmod +x start.sh

# Run the startup script
./start.sh
```

**Option B: Manual startup**
```bash
# Terminal 1 - Backend
cd backend
go mod tidy
go run src/main.go

# Terminal 2 - Frontend (open new Terminal)
cd web
npm install
npm start
```

### 🐧 Linux Installation

#### 1. Install Required Software

**Ubuntu/Debian:**
```bash
# Update package list
sudo apt update

# Install Go
sudo apt install golang-go

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Install Git
sudo apt install git
```

**CentOS/RHEL/Fedora:**
```bash
# Install Go
sudo dnf install golang  # or sudo yum install golang

# Install Node.js and npm
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install nodejs  # or sudo yum install nodejs

# Install Git
sudo dnf install git  # or sudo yum install git
```

#### 2. Clone and Setup Project

```bash
# Clone the repository
git clone <repository-url>
cd kafka-ui-anish-main
```

#### 3. Quick Start (Recommended)

**Option A: Using the provided shell script**
```bash
# Make the script executable (first time only)
chmod +x start.sh

# Run the startup script
./start.sh
```

**Option B: Manual startup**
```bash
# Terminal 1 - Backend
cd backend
go mod tidy
go run src/main.go

# Terminal 2 - Frontend (open new terminal)
cd web
npm install
npm start
```

## Configuration & Usage

### Default Credentials
- **Username:** `admin`
- **Password:** `password`

### Initial Setup
1. **Start the application** using one of the methods above
2. **Access the frontend** at [http://localhost:3000](http://localhost:3000)
3. **Login** with the default credentials
4. **Configure Kafka broker** address in the UI (e.g., `localhost:9092`)
5. **Start using the application**

### Environment Variables (Optional)
- `PORT`: Backend server port (default: `8080`)
- `GIN_MODE`: Set to `release` for production mode

### Kafka Cluster Setup
You'll need access to a Kafka cluster. Options include:
- **Local Kafka:** Install Apache Kafka locally
- **Docker Kafka:** Use Docker containers
- **Cloud Kafka:** AWS MSK, Confluent Cloud, etc.
- **Remote Cluster:** Connect to existing Kafka infrastructure

## Troubleshooting

### Common Issues

**Port Conflicts:**
```bash
# Change backend port
set PORT=8081  # Windows
export PORT=8081  # macOS/Linux
```

**Permission Issues (Windows):**
- Run Command Prompt as Administrator
- Check Windows Firewall settings

**Go Module Issues:**
```bash
cd backend
go mod tidy
go mod download
```

**Node.js Issues:**
```bash
cd web
rm -rf node_modules package-lock.json  # macOS/Linux
# or
rmdir /s node_modules && del package-lock.json  # Windows
npm install
```

**Kafka Connection Issues:**
- Ensure Kafka cluster is running and accessible
- Check firewall settings
- Verify broker address format: `hostname:port`

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Backend Development
```bash
cd backend
go mod tidy
go run src/main.go
```

### Frontend Development
```bash
cd web
npm install
npm start
```

### Testing
```bash
# Backend tests
cd backend
go test ./...

# Frontend tests
cd web
npm test
```

## Scripts
- `start.sh` – Start both backend and frontend (Unix/macOS/Linux)
- `start.bat` – Start both backend and frontend (Windows)

## Quick Start

### Option 1: Using Makefile (Recommended - Cross-Platform)

The easiest way to get started is using the provided Makefile, which works on Windows, Linux, and macOS:

```bash
# First-time setup (install dependencies)
make setup

# Start the application
make start

# Or check what's available
make help
```

### Option 2: Using Platform-Specific Scripts

#### Windows
```cmd
start.bat
```

#### Linux/macOS
```bash
./start.sh
```

## Available Makefile Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make setup` | **First-time setup** - Install all dependencies |
| `make start` | **Start both servers** (assumes setup is done) |
| `make start-backend` | Start only the backend server |
| `make start-frontend` | Start only the frontend server |
| `make stop` | Stop all running processes |
| `make clean` | Clean up temporary files and node_modules |
| `make check-system` | Check system requirements and installed versions |
| `make install-deps` | Install Go and Node.js (part of setup) |
| `make install-go` | Install Go programming language |
| `make install-nodejs` | Install Node.js and npm |

## Workflow

### First Time Setup
```bash
# Install all dependencies and prepare the project
make setup
```

### Daily Development
```bash
# Start both servers
make start

# Or start individual servers
make start-backend
make start-frontend

# Stop servers
make stop
```

### Troubleshooting
```bash
# Check what's installed
make check-system

# Clean up and reinstall dependencies
make clean
make setup
```

## Prerequisites

The `make setup` command will automatically install these dependencies if they're not present:

- **Go 1.24+** - Backend programming language
- **Node.js 18+** - Frontend runtime
- **npm** - Package manager (comes with Node.js)

## Manual Installation

If you prefer to install dependencies manually:

### Go
- **Windows**: Download from [golang.org/dl](https://golang.org/dl/)
- **Linux**: `sudo apt-get install golang-go` (Ubuntu/Debian) or `sudo yum install golang` (RHEL/CentOS)
- **macOS**: `brew install go`

### Node.js
- **Windows**: Download from [nodejs.org](https://nodejs.org/)
- **Linux**: Use NodeSource repositories
- **macOS**: `brew install node@18`

## Accessing the Application

Once started, the application will be available at:

- **Backend API**: http://localhost:8080
- **Frontend UI**: http://localhost:3000

### Default Credentials
- **Username**: admin
- **Password**: password

## Development

### Backend Development
```bash
# Start only the backend
make start-backend

# Or manually
cd backend
go run src/main.go
```

### Frontend Development
```bash
# Start only the frontend
make start-frontend

# Or manually
cd web
npm start
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Use `make stop` to kill existing processes
2. **Permission denied**: On Linux/macOS, you may need to use `sudo` for dependency installation
3. **Node modules issues**: Run `make clean` then `make setup`
4. **Go modules issues**: Run `make setup` to reinstall dependencies

### System Requirements Check
```bash
make check-system
```

This will show you exactly what's installed and what versions you have.

## Project Structure

```
kafka-ui-anish/
├── backend/          # Go backend server
├── web/             # React frontend
├── Makefile         # Cross-platform build commands
├── start.sh         # Linux/macOS startup script
├── start.bat        # Windows startup script
└── README.md        # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `make start`
5. Submit a pull request

## License

[Add your license information here]
