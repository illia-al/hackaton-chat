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

## Setup

### Database Setup

1. Create a PostgreSQL database named `chat_db`
2. Update the database credentials in `src/main/resources/application.properties` if needed

### RabbitMQ Setup

1. Install and start RabbitMQ server
2. Update the RabbitMQ credentials in `src/main/resources/application.properties` if needed

### Backend Setup

1. Navigate to the project root directory
2. Build the project:
   ```bash
   ./mvnw clean install
   ```
3. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```

### Frontend Setup

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
