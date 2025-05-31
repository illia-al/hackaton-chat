# Docker Setup for Chat Application

This project includes Docker configuration for easy deployment and development.

## Prerequisites

- Docker
- Docker Compose

## Files Overview

- `Dockerfile` - Multi-stage build for Spring Boot backend
- `docker-compose.yml` - Production setup (backend + infrastructure)
- `docker-compose.dev.yml` - Development setup (includes frontend)
- `.dockerignore` - Optimizes Docker build context

## Quick Start

### Production Setup (Backend Only)

```bash
# Start the backend with PostgreSQL and RabbitMQ
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Development Setup (Full Stack)

```bash
# Start all services including frontend
docker-compose -f docker-compose.dev.yml up -d

# View logs for specific service
docker-compose -f docker-compose.dev.yml logs -f app
docker-compose -f docker-compose.dev.yml logs -f frontend

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## Services

### Backend (Spring Boot)
- **Port**: 8080
- **Health Check**: http://localhost:8080/actuator/health
- **Dependencies**: PostgreSQL, RabbitMQ

### Frontend (React - dev only)
- **Port**: 3000
- **URL**: http://localhost:3000

### PostgreSQL
- **Port**: 5432
- **Database**: chat_db
- **Username**: postgres
- **Password**: postgres

### RabbitMQ
- **AMQP Port**: 5672
- **Management UI**: http://localhost:15672
- **Username**: guest
- **Password**: guest

## Environment Variables

The Spring Boot application uses the following environment variables in Docker:

```yaml
# Database
SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/chat_db
SPRING_DATASOURCE_USERNAME: postgres
SPRING_DATASOURCE_PASSWORD: postgres

# RabbitMQ
SPRING_RABBITMQ_HOST: rabbitmq
SPRING_RABBITMQ_PORT: 5672
SPRING_RABBITMQ_USERNAME: guest
SPRING_RABBITMQ_PASSWORD: guest

# JPA
SPRING_JPA_HIBERNATE_DDL_AUTO: update
```

## Build Details

The Dockerfile uses a multi-stage build:

1. **Build Stage**: Uses Maven to compile and package the application
2. **Runtime Stage**: Uses lightweight JRE Alpine image
3. **Security**: Runs as non-root user
4. **Health Check**: Includes built-in health monitoring

## Useful Commands

```bash
# Build only the backend image
docker build -t chat-backend .

# Run individual services
docker-compose up postgres rabbitmq  # Infrastructure only
docker-compose up app                # Backend only

# View service status
docker-compose ps

# Access container shell
docker-compose exec app sh
docker-compose exec postgres psql -U postgres -d chat_db

# Remove volumes (clean slate)
docker-compose down -v
```

## Troubleshooting

1. **Port conflicts**: Make sure ports 3000, 5432, 5672, 8080, 15672 are available
2. **Build failures**: Check Docker daemon is running and you have sufficient disk space
3. **Database connection**: Ensure PostgreSQL is healthy before backend starts
4. **Memory issues**: Backend needs at least 512MB RAM

## Production Considerations

- Change default passwords
- Use secrets management
- Configure proper logging
- Set up monitoring
- Use external databases in production
- Configure proper networking and security groups 