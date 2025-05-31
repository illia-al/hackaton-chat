# Contact Management API Documentation

The Contact Management API provides CRUD operations for managing user contacts in the hackaton-chat application.

## Base URL
```
/api/contacts
```

## Endpoints

### 1. Get User Contacts
**GET** `/api/contacts/{username}`

Retrieves all contacts for a specific user.

**Parameters:**
- `username` (path): The username of the user

**Response:**
```json
[
  {
    "id": 1,
    "username": "contact1"
  },
  {
    "id": 2,
    "username": "contact2"
  }
]
```

**Example:**
```bash
curl -X GET http://localhost:8080/api/contacts/john_doe
```

### 2. Add Contact
**POST** `/api/contacts/{username}/add`

Adds a new contact to the user's contact list.

**Parameters:**
- `username` (path): The username of the user

**Request Body:**
```json
{
  "contactUsername": "new_contact"
}
```

**Response:**
```
"Contact added successfully"
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/contacts/john_doe/add \
  -H "Content-Type: application/json" \
  -d '{"contactUsername": "jane_doe"}'
```

### 3. Remove Contact
**DELETE** `/api/contacts/{username}/remove`

Removes a contact from the user's contact list.

**Parameters:**
- `username` (path): The username of the user

**Request Body:**
```json
{
  "contactUsername": "contact_to_remove"
}
```

**Response:**
```
"Contact removed successfully"
```

**Example:**
```bash
curl -X DELETE http://localhost:8080/api/contacts/john_doe/remove \
  -H "Content-Type: application/json" \
  -d '{"contactUsername": "jane_doe"}'
```

### 4. Search Users
**GET** `/api/contacts/search?query={searchTerm}`

Search for users by username (case-insensitive partial matching).

**Parameters:**
- `query` (query param): The search term to find users

**Response:**
```json
[
  {
    "id": 3,
    "username": "john_smith"
  },
  {
    "id": 4,
    "username": "johnny_doe"
  }
]
```

**Example:**
```bash
curl -X GET "http://localhost:8080/api/contacts/search?query=john"
```

### 5. Check Contact Relationship
**GET** `/api/contacts/{username}/check/{contactUsername}`

Check if two users are contacts with each other.

**Parameters:**
- `username` (path): The username of the user
- `contactUsername` (path): The username of the potential contact

**Response:**
```json
{
  "isContact": true
}
```

**Example:**
```bash
curl -X GET http://localhost:8080/api/contacts/john_doe/check/jane_doe
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

- **400 Bad Request**: When the request is invalid or contains errors
- **404 Not Found**: When a user is not found

**Error Response Format:**
```json
"Error message describing the issue"
```

## Features

1. **Bidirectional Contacts**: When user A adds user B as a contact, user B automatically has user A as a contact as well.

2. **Duplicate Prevention**: The API prevents adding the same contact twice.

3. **Case-Insensitive Search**: The search functionality performs case-insensitive partial matching on usernames.

4. **Contact Verification**: Check if two users are connected as contacts.

## Database Schema

The contact relationship is stored in a `user_contacts` table with the following structure:
- `user_id`: Foreign key to the users table
- `contact_id`: Foreign key to the users table

This creates a many-to-many relationship between users. 