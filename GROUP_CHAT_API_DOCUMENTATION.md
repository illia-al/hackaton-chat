# Group Chat Management API Documentation

The Group Chat Management API provides CRUD operations for managing group chats and their participants in the hackaton-chat application.

## Base URL
```
/api/groups
```

## Endpoints

### 1. Create Group Chat
**POST** `/api/groups/create`

Creates a new group chat with the specified owner.

**Request Body:**
```json
{
  "name": "My Group Chat",
  "ownerUsername": "john_doe"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "My Group Chat",
  "ownerUsername": "john_doe"
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/groups/create \
  -H "Content-Type: application/json" \
  -d '{"name": "My Group Chat", "ownerUsername": "john_doe"}'
```

### 2. Get User's Groups
**GET** `/api/groups/user/{username}`

Retrieves all groups that a user is a participant of.

**Parameters:**
- `username` (path): The username of the user

**Response:**
```json
[
  {
    "id": 1,
    "name": "My Group Chat",
    "ownerUsername": "john_doe"
  },
  {
    "id": 2,
    "name": "Another Group",
    "ownerUsername": "jane_doe"
  }
]
```

**Example:**
```bash
curl -X GET http://localhost:8080/api/groups/user/john_doe
```

### 3. Get Group Participants
**GET** `/api/groups/{groupId}/participants`

Retrieves all participants of a specific group.

**Parameters:**
- `groupId` (path): The ID of the group

**Response:**
```json
[
  {
    "id": 1,
    "username": "john_doe"
  },
  {
    "id": 2,
    "username": "jane_doe"
  }
]
```

**Example:**
```bash
curl -X GET http://localhost:8080/api/groups/1/participants
```

### 4. Add Participant to Group
**POST** `/api/groups/{groupId}/participants/add`

Adds a new participant to the group.

**Parameters:**
- `groupId` (path): The ID of the group

**Request Body:**
```json
{
  "username": "new_participant"
}
```

**Response:**
```
"Participant added successfully"
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/groups/1/participants/add \
  -H "Content-Type: application/json" \
  -d '{"username": "new_participant"}'
```

### 5. Remove Participant from Group
**DELETE** `/api/groups/{groupId}/participants/remove`

Removes a participant from the group.

**Parameters:**
- `groupId` (path): The ID of the group

**Request Body:**
```json
{
  "username": "participant_to_remove"
}
```

**Response:**
```
"Participant removed successfully"
```

**Example:**
```bash
curl -X DELETE http://localhost:8080/api/groups/1/participants/remove \
  -H "Content-Type: application/json" \
  -d '{"username": "participant_to_remove"}'
```

### 6. Delete Group
**DELETE** `/api/groups/{groupId}?requesterUsername={username}`

Deletes a group chat. Only the group owner can delete the group.

**Parameters:**
- `groupId` (path): The ID of the group
- `requesterUsername` (query): The username of the user requesting deletion

**Response:**
```
"Group deleted successfully"
```

**Example:**
```bash
curl -X DELETE "http://localhost:8080/api/groups/1?requesterUsername=john_doe"
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

- **400 Bad Request**: When the request is invalid or contains errors
- **404 Not Found**: When a user or group is not found

**Error Response Format:**
```json
"Error message describing the issue"
```

## Business Rules

1. **Group Owner**: The user who creates the group becomes the owner automatically
2. **Owner Participation**: The owner is automatically added as a participant
3. **Owner Restrictions**: The group owner cannot be removed from the group
4. **Deletion Rights**: Only the group owner can delete the group
5. **Duplicate Prevention**: Users cannot be added as participants twice
6. **Participant Limit**: Groups can have up to 300 participants (enforced in ChatService)

## Database Schema

The group chat relationships are stored in separate tables:

### `group_chats` table:
- `id`: Primary key
- `name`: Group name
- `owner_id`: Foreign key to users table

### `group_participants` table:
- `id`: Primary key
- `group_id`: Foreign key to group_chats table
- `user_id`: Foreign key to users table

This creates a many-to-many relationship between groups and users without using JPA @ManyToMany annotations.

## Integration with Chat System

Groups created through this API can be used with the existing chat system:
- Send messages to groups using the WebSocket chat endpoints
- Group participants are validated before allowing message sending
- Group ownership is enforced for administrative actions 