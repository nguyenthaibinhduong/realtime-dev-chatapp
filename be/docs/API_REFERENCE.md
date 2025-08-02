# API Reference Guide

## 📚 Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [User Management](#user-management)
3. [Channel Operations](#channel-operations)
4. [Message Handling](#message-handling)
5. [WebSocket Events](#websocket-events)
6. [Error Responses](#error-responses)
7. [Rate Limiting](#rate-limiting)
8. [API Versioning](#api-versioning)

---

## 🔐 Authentication Endpoints

### Base URL

```
https://api.your-domain.com/auth
```

### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_here",
  "expires_in": 3600,
  "token_type": "Bearer",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "has2FA": false
  }
}
```

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "refresh_token_here"
}
```

**Response (200 OK):**

```json
{
  "access_token": "new_jwt_token",
  "expires_in": 3600
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "message": "Logged out successfully"
}
```

### Two-Factor Authentication

#### Generate 2FA Secret

```http
POST /auth/2fa/generate
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "backupCodes": ["12345678", "87654321", "11223344"]
}
```

#### Verify and Enable 2FA

```http
POST /auth/2fa/verify
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "token": "123456"
}
```

**Response (200 OK):**

```json
{
  "message": "2FA enabled successfully",
  "backupCodes": ["12345678", "87654321", "11223344"]
}
```

#### Login with 2FA

```http
POST /auth/login/2fa
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "token": "123456"
}
```

#### Disable 2FA

```http
DELETE /auth/2fa
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "password": "SecurePassword123!",
  "token": "123456"
}
```

---

## 👥 User Management

### Base URL

```
https://api.your-domain.com/users
```

### Get Current User Profile

```http
GET /users/profile
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "isActive": true,
  "has2FA": true,
  "lastLoginAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update User Profile

```http
PATCH /users/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "Jonathan",
  "lastName": "Smith"
}
```

**Response (200 OK):**

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "Jonathan",
    "lastName": "Smith",
    "role": "user",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Change Password

```http
PATCH /users/password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Response (200 OK):**

```json
{
  "message": "Password changed successfully"
}
```

### Get All Users (Admin/Moderator only)

```http
GET /users?page=1&limit=10&search=john&role=user&isActive=true
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Get User by ID (Admin/Moderator only)

```http
GET /users/{userId}
Authorization: Bearer <access_token>
```

### Update User (Admin only)

```http
PATCH /users/{userId}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "role": "moderator",
  "isActive": false
}
```

### Delete User (Admin only)

```http
DELETE /users/{userId}
Authorization: Bearer <access_token>
```

---

## 📢 Channel Operations

### Base URL

```
https://api.your-domain.com/channels
```

### Get All Channels

```http
GET /channels?page=1&limit=10&type=public&search=general
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "general",
      "description": "General discussion channel",
      "type": "public",
      "isActive": true,
      "memberCount": 25,
      "createdBy": {
        "id": "uuid",
        "username": "admin"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Get Channel by ID

```http
GET /channels/{channelId}
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "general",
  "description": "General discussion channel",
  "type": "public",
  "isActive": true,
  "memberCount": 25,
  "members": [
    {
      "id": "uuid",
      "username": "johndoe",
      "role": "member",
      "joinedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "createdBy": {
    "id": "uuid",
    "username": "admin"
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Create Channel

```http
POST /channels
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "development",
  "description": "Development team discussions",
  "type": "private"
}
```

**Response (201 Created):**

```json
{
  "message": "Channel created successfully",
  "channel": {
    "id": "uuid",
    "name": "development",
    "description": "Development team discussions",
    "type": "private",
    "isActive": true,
    "memberCount": 1,
    "createdBy": {
      "id": "uuid",
      "username": "johndoe"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Channel (Creator/Admin only)

```http
PATCH /channels/{channelId}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "dev-team",
  "description": "Updated description"
}
```

### Delete Channel (Creator/Admin only)

```http
DELETE /channels/{channelId}
Authorization: Bearer <access_token>
```

### Join Channel

```http
POST /channels/{channelId}/join
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "message": "Joined channel successfully"
}
```

### Leave Channel

```http
POST /channels/{channelId}/leave
Authorization: Bearer <access_token>
```

### Add Member to Channel (Creator/Admin only)

```http
POST /channels/{channelId}/members
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "userId": "uuid",
  "role": "member"
}
```

### Remove Member from Channel (Creator/Admin only)

```http
DELETE /channels/{channelId}/members/{userId}
Authorization: Bearer <access_token>
```

---

## 💬 Message Handling

### Base URL

```
https://api.your-domain.com/messages
```

### Get Channel Messages

```http
GET /messages/channel/{channelId}?page=1&limit=50&before=2024-01-01T00:00:00.000Z
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Hello everyone!",
      "type": "text",
      "channelId": "uuid",
      "author": {
        "id": "uuid",
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe"
      },
      "edited": false,
      "editedAt": null,
      "attachments": [],
      "reactions": [
        {
          "emoji": "👍",
          "count": 3,
          "users": ["uuid1", "uuid2", "uuid3"]
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2,
    "hasMore": true
  }
}
```

### Send Message

```http
POST /messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "channelId": "uuid",
  "content": "Hello everyone!",
  "type": "text",
  "replyTo": "uuid" // Optional: reply to another message
}
```

**Response (201 Created):**

```json
{
  "message": "Message sent successfully",
  "data": {
    "id": "uuid",
    "content": "Hello everyone!",
    "type": "text",
    "channelId": "uuid",
    "author": {
      "id": "uuid",
      "username": "johndoe"
    },
    "replyTo": null,
    "edited": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Edit Message (Author only)

```http
PATCH /messages/{messageId}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Updated message content"
}
```

### Delete Message (Author/Admin/Moderator only)

```http
DELETE /messages/{messageId}
Authorization: Bearer <access_token>
```

### Add Reaction

```http
POST /messages/{messageId}/reactions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "emoji": "👍"
}
```

### Remove Reaction

```http
DELETE /messages/{messageId}/reactions/{emoji}
Authorization: Bearer <access_token>
```

### Upload File

```http
POST /messages/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: [binary file data]
channelId: uuid
```

**Response (201 Created):**

```json
{
  "message": "File uploaded successfully",
  "data": {
    "id": "uuid",
    "content": "[File: document.pdf]",
    "type": "file",
    "channelId": "uuid",
    "attachments": [
      {
        "id": "uuid",
        "filename": "document.pdf",
        "originalName": "document.pdf",
        "mimeType": "application/pdf",
        "size": 1024000,
        "url": "/uploads/files/uuid-document.pdf"
      }
    ],
    "author": {
      "id": "uuid",
      "username": "johndoe"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 🔌 WebSocket Events

### Connection

```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token',
  },
});
```

### Client Events (Emit)

#### Join Channel

```javascript
socket.emit('join_channel', {
  channelId: 'uuid',
});
```

#### Leave Channel

```javascript
socket.emit('leave_channel', {
  channelId: 'uuid',
});
```

#### Send Message

```javascript
socket.emit('send_message', {
  channelId: 'uuid',
  content: 'Hello everyone!',
  type: 'text',
  replyTo: 'uuid', // optional
});
```

#### Typing Indicator

```javascript
// Start typing
socket.emit('typing_start', {
  channelId: 'uuid',
});

// Stop typing
socket.emit('typing_stop', {
  channelId: 'uuid',
});
```

#### Join Voice Channel

```javascript
socket.emit('join_voice', {
  channelId: 'uuid',
});
```

#### Leave Voice Channel

```javascript
socket.emit('leave_voice', {
  channelId: 'uuid',
});
```

### Server Events (Listen)

#### New Message

```javascript
socket.on('new_message', (message) => {
  console.log('New message:', message);
  // message has same structure as REST API response
});
```

#### Message Updated

```javascript
socket.on('message_updated', (message) => {
  console.log('Message updated:', message);
});
```

#### Message Deleted

```javascript
socket.on('message_deleted', (data) => {
  console.log('Message deleted:', data.messageId);
});
```

#### User Joined Channel

```javascript
socket.on('user_joined', (data) => {
  console.log('User joined:', data.user, 'Channel:', data.channelId);
});
```

#### User Left Channel

```javascript
socket.on('user_left', (data) => {
  console.log('User left:', data.user, 'Channel:', data.channelId);
});
```

#### Typing Events

```javascript
socket.on('user_typing', (data) => {
  console.log('User typing:', data.user, 'Channel:', data.channelId);
});

socket.on('user_stopped_typing', (data) => {
  console.log('User stopped typing:', data.user, 'Channel:', data.channelId);
});
```

#### Voice Channel Events

```javascript
socket.on('user_joined_voice', (data) => {
  console.log('User joined voice:', data.user, 'Channel:', data.channelId);
});

socket.on('user_left_voice', (data) => {
  console.log('User left voice:', data.user, 'Channel:', data.channelId);
});
```

#### Connection Events

```javascript
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

---

## ❌ Error Responses

### Standard Error Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/auth/login",
  "details": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

### Common Error Codes

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Invalid input data",
  "error": "Bad Request"
}
```

#### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

#### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

#### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

#### 422 Unprocessable Entity

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "error": "Unprocessable Entity",
  "details": [
    {
      "field": "username",
      "message": "Username must be unique"
    }
  ]
}
```

#### 429 Too Many Requests

```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Too Many Requests",
  "retryAfter": 60
}
```

#### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## 🚦 Rate Limiting

### Default Limits

| Endpoint           | Limit        | Window     |
| ------------------ | ------------ | ---------- |
| `/auth/login`      | 5 requests   | 15 minutes |
| `/auth/register`   | 3 requests   | 60 minutes |
| `/auth/refresh`    | 10 requests  | 15 minutes |
| `/messages` (POST) | 30 requests  | 1 minute   |
| `/channels` (POST) | 5 requests   | 10 minutes |
| Global API         | 100 requests | 15 minutes |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
X-RateLimit-Window: 900
```

### Rate Limit Response

```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Too Many Requests",
  "retryAfter": 60
}
```

---

## 📋 API Versioning

### Current Version

All endpoints are currently version 1 and accessible without version prefix.

### Future Versioning

When v2 is released, endpoints will be available as:

```
/v1/auth/login  (legacy)
/v2/auth/login  (new)
/auth/login     (defaults to latest)
```

### Version Headers

```http
Accept: application/json; version=1
API-Version: 1
```

---

## 🔍 Search API

### Search Messages

```http
GET /search/messages?q=hello&channelId=uuid&limit=20&offset=0
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Hello everyone!",
      "channelId": "uuid",
      "author": {
        "id": "uuid",
        "username": "johndoe"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "highlight": "**Hello** everyone!"
    }
  ],
  "meta": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "query": "hello"
  }
}
```

### Search Users

```http
GET /search/users?q=john&limit=10&offset=0
Authorization: Bearer <access_token>
```

### Search Channels

```http
GET /search/channels?q=dev&limit=10&offset=0
Authorization: Bearer <access_token>
```

---

## 📊 Analytics Endpoints (Admin only)

### Get User Statistics

```http
GET /analytics/users?period=7d&groupBy=day
Authorization: Bearer <access_token>
```

### Get Message Statistics

```http
GET /analytics/messages?period=30d&channelId=uuid
Authorization: Bearer <access_token>
```

### Get Channel Statistics

```http
GET /analytics/channels?period=7d
Authorization: Bearer <access_token>
```

---

## 🔗 Webhook Integration

### GitHub Webhook

```http
POST /webhooks/github
Content-Type: application/json
X-GitHub-Event: push
X-Hub-Signature-256: sha256=...

{
  "action": "push",
  "repository": {
    "name": "my-repo",
    "full_name": "user/my-repo"
  },
  "commits": [...]
}
```

### Slack Integration

```http
POST /integrations/slack/install
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "code": "slack-oauth-code",
  "channelId": "uuid"
}
```

---

## 📱 Mobile App Support

### FCM Push Notifications

```http
POST /notifications/register
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "token": "fcm-device-token",
  "platform": "ios"
}
```

### Get Notifications

```http
GET /notifications?page=1&limit=20&unread=true
Authorization: Bearer <access_token>
```

### Mark as Read

```http
PATCH /notifications/{notificationId}/read
Authorization: Bearer <access_token>
```

---

**Need help?** Check the [Developer Guide](./DEVELOPER_GUIDE.md) or contact the development team.
