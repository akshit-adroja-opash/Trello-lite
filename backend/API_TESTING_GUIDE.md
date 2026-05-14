# API Testing Guide

This guide covers how to test all backend APIs for the Trello-lite application.

## Tools for API Testing

### Option 1: Postman (Recommended)
- Download: https://www.postman.com/downloads/
- Supports environment variables, collections, and automated testing
- Easy to share collections with team

### Option 2: Thunder Client (VS Code Extension)
- Install from VS Code Extensions marketplace
- Lightweight, built-in to VS Code
- Good for quick testing

### Option 3: cURL (Command Line)
- Built-in on Windows/Mac/Linux
- No installation required
- Best for scripting and automation

### Option 4: REST Client (VS Code Extension)
- Create `.rest` or `.http` files
- Quick testing without leaving VS Code

---

## Setup

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```

Server runs on: `http://localhost:5000`

### 2. Environment Variables
Create `.env` file in `/backend`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/trello-lite
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000
```

---

## API Testing Collection

### Auth Endpoints

#### 1. Register User
```
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```
**Expected Response (201):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k",
      "username": "testuser",
      "email": "test@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login User
```
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```
**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k",
      "username": "testuser",
      "email": "test@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Get Current User
```
GET http://localhost:5000/api/v1/auth/me
Authorization: Bearer <your-token-from-login>
```
**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k",
      "username": "testuser",
      "email": "test@example.com"
    }
  }
}
```

---

### Workspace Endpoints

#### 1. Create Workspace
```
POST http://localhost:5000/api/v1/workspaces
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "My Team Workspace",
  "description": "Team project planning"
}
```
**Expected Response (201):**
```json
{
  "status": "success",
  "data": {
    "workspace": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k",
      "name": "My Team Workspace",
      "description": "Team project planning",
      "owner": "65a1b2c3d4e5f6g7h8i9j0l",
      "members": [
        {
          "user": "65a1b2c3d4e5f6g7h8i9j0l",
          "role": "admin"
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### 2. Get All Workspaces
```
GET http://localhost:5000/api/v1/workspaces
Authorization: Bearer <your-token>
```
**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "workspaces": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k",
        "name": "My Team Workspace",
        "description": "Team project planning",
        "owner": "65a1b2c3d4e5f6g7h8i9j0l",
        "members": [...]
      }
    ]
  }
}
```

---

### Board Endpoints

#### 1. Create Board
```
POST http://localhost:5000/api/v1/boards
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "Sprint 1",
  "workspaceId": "65a1b2c3d4e5f6g7h8i9j0k",
  "background": "#0079bf"
}
```
**Expected Response (201):**
```json
{
  "status": "success",
  "data": {
    "board": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0m",
      "name": "Sprint 1",
      "workspace": "65a1b2c3d4e5f6g7h8i9j0k",
      "owner": "65a1b2c3d4e5f6g7h8i9j0l",
      "background": "#0079bf",
      "isStarred": false,
      "createdAt": "2024-01-15T10:35:00Z"
    }
  }
}
```

#### 2. Get Boards by Workspace
```
GET http://localhost:5000/api/v1/boards/workspace/65a1b2c3d4e5f6g7h8i9j0k
Authorization: Bearer <your-token>
```
**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "boards": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0m",
        "name": "Sprint 1",
        "workspace": "65a1b2c3d4e5f6g7h8i9j0k",
        "owner": "65a1b2c3d4e5f6g7h8i9j0l",
        "background": "#0079bf"
      }
    ]
  }
}
```

---

### Column Endpoints

#### 1. Create Column
```
POST http://localhost:5000/api/v1/columns
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "To Do",
  "boardId": "65a1b2c3d4e5f6g7h8i9j0m",
  "order": "a"
}
```
**Expected Response (201):**
```json
{
  "status": "success",
  "data": {
    "column": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0n",
      "name": "To Do",
      "board": "65a1b2c3d4e5f6g7h8i9j0m",
      "order": "a",
      "createdAt": "2024-01-15T10:40:00Z"
    }
  }
}
```

#### 2. Get Columns by Board
```
GET http://localhost:5000/api/v1/columns/board/65a1b2c3d4e5f6g7h8i9j0m
Authorization: Bearer <your-token>
```
**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "columns": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0n",
        "name": "To Do",
        "board": "65a1b2c3d4e5f6g7h8i9j0m",
        "order": "a"
      }
    ]
  }
}
```

---

### Card Endpoints

#### 1. Create Card
```
POST http://localhost:5000/api/v1/cards
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "title": "Fix login bug",
  "columnId": "65a1b2c3d4e5f6g7h8i9j0n",
  "boardId": "65a1b2c3d4e5f6g7h8i9j0m",
  "order": "a",
  "description": "User cannot login with email",
  "dueDate": "2024-01-20T23:59:59Z",
  "assignees": ["65a1b2c3d4e5f6g7h8i9j0l"],
  "labels": [
    {
      "name": "bug",
      "color": "#ff0000"
    }
  ]
}
```
**Expected Response (201):**
```json
{
  "status": "success",
  "data": {
    "card": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0o",
      "title": "Fix login bug",
      "column": "65a1b2c3d4e5f6g7h8i9j0n",
      "board": "65a1b2c3d4e5f6g7h8i9j0m",
      "order": "a",
      "description": "User cannot login with email",
      "dueDate": "2024-01-20T23:59:59Z",
      "assignees": ["65a1b2c3d4e5f6g7h8i9j0l"],
      "labels": [{"name": "bug", "color": "#ff0000"}],
      "createdAt": "2024-01-15T10:45:00Z"
    }
  }
}
```

#### 2. Get Cards by Column
```
GET http://localhost:5000/api/v1/cards/column/65a1b2c3d4e5f6g7h8i9j0n
Authorization: Bearer <your-token>
```
**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "cards": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0o",
        "title": "Fix login bug",
        "column": "65a1b2c3d4e5f6g7h8i9j0n",
        "board": "65a1b2c3d4e5f6g7h8i9j0m",
        "order": "a",
        "description": "User cannot login with email",
        "dueDate": "2024-01-20T23:59:59Z"
      }
    ]
  }
}
```

#### 3. Update Card
```
PATCH http://localhost:5000/api/v1/cards/65a1b2c3d4e5f6g7h8i9j0o
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "title": "Fix critical login bug",
  "description": "User cannot login with email or password reset",
  "dueDate": "2024-01-18T23:59:59Z",
  "labels": [
    {
      "name": "critical",
      "color": "#ff0000"
    }
  ]
}
```
**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "card": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0o",
      "title": "Fix critical login bug",
      "description": "User cannot login with email or password reset",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  }
}
```

---

## Testing with cURL Examples

### Register and Login (Get Token)
```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Create Workspace
```bash
curl -X POST http://localhost:5000/api/v1/workspaces \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Team Workspace",
    "description": "Team project planning"
  }'
```

### Create Board
```bash
curl -X POST http://localhost:5000/api/v1/boards \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sprint 1",
    "workspaceId": "WORKSPACE_ID_HERE",
    "background": "#0079bf"
  }'
```

### Create Column
```bash
curl -X POST http://localhost:5000/api/v1/columns \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "To Do",
    "boardId": "BOARD_ID_HERE",
    "order": "a"
  }'
```

### Create Card
```bash
curl -X POST http://localhost:5000/api/v1/cards \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login bug",
    "columnId": "COLUMN_ID_HERE",
    "boardId": "BOARD_ID_HERE",
    "order": "a",
    "description": "User cannot login"
  }'
```

### Update Card
```bash
curl -X PATCH http://localhost:5000/api/v1/cards/CARD_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title",
    "description": "Updated description"
  }'
```

---

## Testing with Thunder Client (VS Code)

1. Install Thunder Client extension
2. Create a new request
3. Set method to `POST/GET/PATCH`
4. Enter URL: `http://localhost:5000/api/v1/auth/register`
5. Go to **Auth** tab → select **Bearer Token**
6. Paste your token
7. Go to **Body** tab → select **JSON** and paste request body
8. Click **Send**

---

## Testing Checklist

- [ ] Register new user
- [ ] Login with correct credentials
- [ ] Try login with wrong password (should return 401)
- [ ] Access protected route without token (should return 401)
- [ ] Create workspace
- [ ] Get all workspaces
- [ ] Create board in workspace
- [ ] Get boards by workspace
- [ ] Create column in board
- [ ] Get columns by board
- [ ] Create card in column
- [ ] Get cards by column
- [ ] Update card details
- [ ] Verify authentication middleware works
- [ ] Test invalid MongoDB IDs (should return error)

---

## Common Issues

### 1. Token Expired or Invalid
```
Error: "Unauthorized"
Solution: Login again and get a fresh token
```

### 2. Invalid Workspace/Board/Column/Card ID
```
Error: "Cast to ObjectId failed"
Solution: Make sure you're using valid MongoDB ObjectIds
```

### 3. CORS Error
```
Error: "Access to XMLHttpRequest blocked by CORS"
Solution: Make sure CORS_ORIGIN env var matches your frontend URL
```

### 4. Database Connection Failed
```
Error: "Failed to connect to MongoDB"
Solution: Ensure MongoDB is running and MONGODB_URI is correct
```

---

## Next Steps

1. Create missing APIs (see `MISSING_APIS.md`)
2. Add role-based authorization checks
3. Test with Socket.IO for real-time updates
4. Load test with multiple concurrent requests
