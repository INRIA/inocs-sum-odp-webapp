# API Documentation

## Base URL
All API endpoints are prefixed with `/api/v1`

## Users API

### GET /api/v1/users
Get all users or filter users by criteria.

**Query Parameters:**
- `id`: Get specific user by ID
- `status`: Filter by user status (`signup`, `active`, `disabled`)
- `role_id`: Filter by role ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "picture": "https://example.com/avatar.jpg",
      "role_id": 1,
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z",
      "role": {
        "id": 1,
        "name": "Admin",
        "description": "Administrator role"
      }
    }
  ],
  "count": 1
}
```

### POST /api/v1/users
Create a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123",
  "password_confirmation": "password123",
  "phone": "+1234567890",
  "picture": "https://example.com/avatar.jpg",
  "role_id": 1,
  "status": "signup"
}
```

**Required Fields:**
- `email`
- `name`
- `password`
- `role_id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "picture": "https://example.com/avatar.jpg",
    "role_id": 1,
    "status": "signup",
    "created_at": "2024-01-01T00:00:00.000Z",
    "role": {
      "id": 1,
      "name": "Admin",
      "description": "Administrator role"
    }
  },
  "message": "User created successfully"
}
```

### PUT /api/v1/users
Update an existing user.

**Request Body:**
```json
{
  "id": 1,
  "email": "updated@example.com",
  "name": "Updated Name",
  "phone": "+0987654321",
  "status": "active"
}
```

**Required Fields:**
- `id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "updated@example.com",
    "name": "Updated Name",
    "phone": "+0987654321",
    "picture": "https://example.com/avatar.jpg",
    "role_id": 1,
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "role": {
      "id": 1,
      "name": "Admin",
      "description": "Administrator role"
    }
  },
  "message": "User updated successfully"
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `409`: Conflict (e.g., email already exists)
- `500`: Internal Server Error

## Authentication

Currently, no authentication is implemented. In production, you should add:
- JWT authentication
- Role-based authorization
- Password hashing (bcrypt)
- Rate limiting
- Input sanitization