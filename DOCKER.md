# Docker Setup for Calculator Project

This project includes a complete Docker setup to run both the backend and frontend with a single command, regardless of your operating system or installed tools.

## Prerequisites

- **Docker**: [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: Usually included with Docker Desktop

## Quick Start

Run the entire application with:

```bash
docker-compose up
```

This command will:
1. Build the backend Docker image
2. Build the frontend Docker image
3. Start both services in a shared network
4. Expose backend on `http://localhost:8080`
5. Expose frontend on `http://localhost:3000`

## Services

### Backend
- **Language**: Go
- **Port**: 8080
- **Container**: `calculator-backend`
- **Build**: Multi-stage build for minimal image size
- **Health Check**: Verifies API is responding before frontend starts

### Frontend
- **Language**: TypeScript + React + Vite
- **Port**: 3000
- **Container**: `calculator-frontend`
- **Build**: Multi-stage build (build + serve)
- **API Configuration**: Automatically points to backend service

## Common Commands

### Start the application
```bash
docker-compose up
```

### Start in background
```bash
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f
```

### View specific service logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop the application
```bash
docker-compose down
```

### Remove containers and volumes
```bash
docker-compose down -v
```

### Rebuild images
```bash
docker-compose build --no-cache
```

### Run a single service
```bash
docker-compose up backend
docker-compose up frontend
```

## Architecture

```
docker-compose.yml
├── backend service
│   ├── Builds from: ./backend/Dockerfile
│   ├── Exposes: 8080
│   └── Network: calculator-network
│
├── frontend service
│   ├── Builds from: ./frontend/Dockerfile
│   ├── Exposes: 3000
│   ├── Depends on: backend (healthy)
│   └── Network: calculator-network
│
└── Network: calculator-network (bridge)
```

## Environment Variables

### Frontend
- `VITE_API_URL`: Set to `http://backend:8080` (internal Docker network)

### Backend
- `PORT`: Set to `8080`

## Development vs Production

This setup uses production builds:
- **Backend**: Compiled Go binary, minimal Alpine image
- **Frontend**: Built and served with `serve` package

For local development without Docker, refer to the project READMEs:
- Backend: `/backend/README.md` (if exists) or run `go run ./cmd/server`
- Frontend: `/frontend/README.md` or run `npm run dev`

## Troubleshooting

### Port already in use
```bash
# Change ports in docker-compose.yml
# Or kill processes using those ports
lsof -i :8080  # Check port 8080
lsof -i :3000  # Check port 3000
```

### Image build fails
```bash
docker-compose build --no-cache
```

### Container crashes
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Frontend can't reach backend
- Ensure backend health check passes (visible in logs)
- Verify `VITE_API_URL` environment variable is set correctly

## Network Communication

Inside Docker containers:
- Backend is accessible at `http://backend:8080`
- Frontend is accessible at `http://frontend:3000`

From your machine:
- Backend: `http://localhost:8080`
- Frontend: `http://localhost:3000`
