@baseUrl = http://localhost:5000/api/v1
@authToken = YOUR_JWT_TOKEN_HERE

### 1. Register User
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
}

### 2. Login User
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
    "email": "test@example.com",
    "password": "password123"
}
    
### 3. Get Current User (Requires Auth)
GET {{baseUrl}}/auth/me
Authorization: Bearer {{authToken}}

### 4. Create Workspace
POST {{baseUrl}}/workspaces
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
    "name": "My Project Workspace",
    "description": "Handling all Trello-lite tasks"
}

### 5. Get Workspaces
GET {{baseUrl}}/workspaces
Authorization: Bearer {{authToken}}
