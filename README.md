# Chat Application

A real-time chat application built with Spring Boot and React.js, featuring direct messaging and group chats.

## Features

- User registration and authentication
- Direct messaging between users
- Group chat creation and management
- Real-time message delivery using WebSocket
- Message history persistence
- Message search functionality

## Prerequisites

- Java 17 or higher
- Node.js 14 or higher
- PostgreSQL
- RabbitMQ
- Docker and Docker Compose (for containerized setup)

## Setup

### Option 1: Docker Compose Setup (Recommended)

1. Make sure Docker and Docker Compose are installed
2. From the project root directory, run:
   ```bash
   docker-compose up --build
   ```
3. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8080
   - RabbitMQ Management: http://localhost:15672 (guest/guest)

To stop the application:
```bash
docker-compose down
```

For more detailed information on the Docker setup, including development and production configurations, see [DOCKER_README.md](./DOCKER_README.md).


### Option 2: Manual Setup

#### Database Setup

1. Create a PostgreSQL database named `chat_db`
2. Update the database credentials in `src/main/resources/application.properties` if needed

#### RabbitMQ Setup

1. Install and start RabbitMQ server
2. Update the RabbitMQ credentials in `src/main/resources/application.properties` if needed

#### Backend Setup

1. Navigate to the project root directory
2. Build the project:
   ```bash
   ./mvnw clean install
   ```
3. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```

#### Frontend Setup

1. Navigate to the chat-ui directory:
   ```bash
   cd chat-ui
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

The application will be available at:
- Backend: http://localhost:8080
- Frontend: http://localhost:3000

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user

### Chat
- POST `/api/chat/direct` - Send a direct message
- POST `/api/chat/group` - Create a group chat
- POST `/api/chat/group/{groupId}/message` - Send a group message
- POST `/api/chat/group/{groupId}/leave` - Leave a group chat
- DELETE `/api/chat/group/{groupId}` - Delete a group chat
- GET `/api/chat/search` - Search messages

## WebSocket Endpoints

- `/ws` - WebSocket connection endpoint
- `/app/chat.direct` - Send direct messages
- `/app/chat.group` - Send group messages
- `/user/{username}/queue/messages` - Receive messages
- `/topic/group.{groupId}` - Receive group messages 

## Contact API

See [Contact API Documentation](CONTACT_API_DOCUMENTATION.md) for detailed information about contact management endpoints.

## Docker Environment Variables

The application uses the following environment variables in Docker:

```yaml
# Frontend
REACT_APP_API_BASE_URL: http://localhost:8080

# Backend
SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/chat_db
SPRING_DATASOURCE_USERNAME: postgres
SPRING_DATASOURCE_PASSWORD: postgres
SPRING_RABBITMQ_HOST: rabbitmq
SPRING_RABBITMQ_PORT: 5672
SPRING_RABBITMQ_USERNAME: guest
SPRING_RABBITMQ_PASSWORD: guest
```
