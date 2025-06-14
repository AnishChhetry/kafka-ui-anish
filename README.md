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

## Setup & Usage

### Prerequisites
- Go 1.24+
- Node.js 18+
- Kafka cluster (broker address will be configured through the UI)

### Backend
```sh
cd backend
# Install Go dependencies
go mod tidy
# Run the backend
cd src
go run main.go
```

### Frontend
```sh
cd web
npm install
npm start
```

### Default Credentials
- Username: `admin`
- Password: `password`

### Configuration
1. Start both backend and frontend
2. Login with default credentials
3. Configure Kafka broker address in the UI (e.g., `localhost:9092`)
4. Start using the application

### Changing Password
- Use the UI or call `/api/change-password` (JWT required)

## Scripts
- `start.sh` – Start both backend and frontend (Unix)
- `start.bat` – Start both backend and frontend (Windows)

## Contributing
Pull requests are welcome! Please open an issue first to discuss major changes.

## License
MIT 