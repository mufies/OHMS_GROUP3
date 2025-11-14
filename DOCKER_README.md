# Docker Setup Guide for OHMS Project

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 1.29 or higher)
- .env file with required Firebase and database credentials

## Quick Start

### 1. Prepare Environment Variables

Copy the example environment file and update with your actual values:

```bash
cp .env.example .env
```

Edit `.env` file with your Firebase and database credentials.

### 2. Build and Run with Docker Compose

To build and start all services:

```bash
docker-compose up -d
```

To build without cache:

```bash
docker-compose up -d --build
```

### 3. Access the Applications

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **MySQL Database**: localhost:3306

## Service Details

### OHMS Frontend (OHMS_FE)
- **Image**: Node.js 22 Alpine (multi-stage build)
- **Port**: 5173
- **Build Time**: ~5-10 minutes (first build)
- **Features**:
  - Multi-stage build for optimized image size
  - React + Vite application
  - Health check enabled

### OHMS Backend (OHMS_BE)
- **Image**: Eclipse Temurin 21 JRE Alpine
- **Port**: 8080
- **Build Time**: ~3-5 minutes (first build)
- **Features**:
  - Spring Boot 3.5.5
  - Maven build optimization
  - Non-root user for security
  - Health check enabled

### OHMS Database (MySQL)
- **Image**: MySQL 8.0 Alpine
- **Port**: 3306
- **Default Database**: ohms_db
- **Features**:
  - Persistent volume for data
  - Health check enabled

## Useful Docker Commands

### View Container Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f ohms-backend
docker-compose logs -f ohms-frontend
docker-compose logs -f ohms-db
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Rebuild Specific Service

```bash
docker-compose up -d --build ohms-backend
docker-compose up -d --build ohms-frontend
```

### Execute Commands in Container

```bash
# Access backend container shell
docker exec -it ohms-backend sh

# Access database shell
docker exec -it ohms-db mysql -u ohms_user -p ohms_db
```

### Check Container Status

```bash
docker-compose ps
```

## Troubleshooting

### Port Already in Use
If ports 5173, 8080, or 3306 are already in use:

```bash
# Change ports in docker-compose.yml
# Or stop other services using these ports
docker ps
docker stop <container_id>
```

### Database Connection Failed
1. Ensure MySQL container is running: `docker-compose ps`
2. Check MySQL logs: `docker-compose logs ohms-db`
3. Verify credentials in .env file match docker-compose.yml
4. Wait for MySQL to start (health check ensures this)

### Frontend Can't Connect to Backend
1. Ensure both services are running: `docker-compose ps`
2. Check firewall/network settings
3. Verify VITE_API_URL environment variable is correct
4. Check backend logs: `docker-compose logs ohms-backend`

### Out of Memory
If Docker runs out of memory:
1. Stop other Docker containers
2. Increase Docker memory limit in Docker Desktop settings
3. Clear unused images: `docker image prune`

## Building Individual Docker Images

### Build Frontend Image Only

```bash
docker build -t ohms-frontend:latest ./OHMS_FE
```

### Build Backend Image Only

```bash
docker build -t ohms-backend:latest ./OHMS_BE
```

### Run Individual Containers

```bash
# Run frontend
docker run -p 5173:5173 -e VITE_API_URL=http://localhost:8080 ohms-frontend:latest

# Run backend
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/ohms_db \
  -e SPRING_DATASOURCE_USERNAME=ohms_user \
  -e SPRING_DATASOURCE_PASSWORD=ohms_password \
  ohms-backend:latest
```

## Production Deployment

For production deployment:

1. Update docker-compose.yml with production database credentials
2. Use environment-specific .env files
3. Add reverse proxy (nginx) for SSL/TLS
4. Configure proper restart policies
5. Set up monitoring and logging
6. Use Docker secrets for sensitive data

## Network Architecture

```
┌─────────────────┐
│   Frontend      │
│ (Port 5173)     │
└────────┬────────┘
         │
    ohms-network
         │
    ┌────┴──────────────────┐
    │                       │
┌───┴──────────┐   ┌───────┴──────┐
│   Backend    │   │   Database   │
│ (Port 8080)  │   │ (Port 3306)  │
└──────────────┘   └──────────────┘
```

## Notes

- All services are connected via Docker network `ohms-network`
- Database data persists in volume `ohms-db-data`
- Health checks are configured for all services
- Images use Alpine Linux variants for smaller sizes
- Multi-stage builds optimize final image sizes
