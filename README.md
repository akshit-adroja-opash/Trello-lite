# Trello-lite — Real-Time Collaborative Kanban Board

A full-stack MERN Kanban app with real-time collaboration via Socket.IO, drag-and-drop, role-based access control, and optimistic UI updates.

## Tech Stack
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT
- **Frontend**: React, Zustand, dnd-kit, react-markdown, react-window, Tailwind CSS

---

## Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (or a MongoDB Atlas URI)

### 1. Clone & install

```bash
git clone <repo-url>
cd Trello-lite

# Backend
cd backend
cp .env.example .env   # fill in your values
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Environment variables

**backend/.env**
| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random secret for JWT signing |
| `JWT_SECRET_EXPIRY` | Token expiry (e.g. `7d`) |
| `NODE_ENV` | `development` or `production` |
| `CORS_ORIGIN` | Frontend origin (e.g. `http://localhost:5173`) |

**frontend/.env**
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Socket.IO server URL |

### 3. Seed demo data (< 2 minutes to test)

```bash
cd backend
npm run seed
```

This creates:
- **alice@demo.com** / `password123` — Owner
- **bob@demo.com** / `password123` — Editor
- **carol@demo.com** / `password123` — Viewer
- Workspace "Acme Corp" with board "Product Roadmap" (3 columns, 5 cards)

### 4. Run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open http://localhost:5173

---

## API Reference

### Auth
```
POST /api/v1/auth/register   { username, email, password }
POST /api/v1/auth/login      { email, password }
GET  /api/v1/auth/me         (Bearer token)
POST /api/v1/auth/logout
```

### Workspaces
```
POST   /api/v1/workspaces                              Create workspace
GET    /api/v1/workspaces                              List my workspaces
POST   /api/v1/workspaces/:id/invite                  { email, role }
GET    /api/v1/workspaces/:id/members
PATCH  /api/v1/workspaces/:id/members/:memberId       { role }
DELETE /api/v1/workspaces/:id/members/:memberId
PATCH  /api/v1/workspaces/:id                         { name, description }
DELETE /api/v1/workspaces/:id
```

### Boards
```
POST   /api/v1/boards                                  { name, workspaceId, background }
GET    /api/v1/boards/workspace/:workspaceId
GET    /api/v1/boards/:boardId
PATCH  /api/v1/boards/:boardId                         { name, background }
DELETE /api/v1/boards/:boardId
GET    /api/v1/boards/:boardId/members
POST   /api/v1/boards/:boardId/members                 { email, role }
PATCH  /api/v1/boards/:boardId/members/:memberId       { role }
```

### Columns
```
POST   /api/v1/columns                                 { name, boardId }
GET    /api/v1/columns/board/:boardId
PATCH  /api/v1/columns/reorder                         { columnId, prevOrder, nextOrder }
PATCH  /api/v1/columns/:columnId                       { name }
DELETE /api/v1/columns/:columnId
```

### Cards
```
POST   /api/v1/cards                                   { title, columnId, boardId, order, ... }
GET    /api/v1/cards/column/:columnId
GET    /api/v1/cards/:cardId
PATCH  /api/v1/cards/:cardId                           { title, description, labels, dueDate, checklist, version }
DELETE /api/v1/cards/:cardId
PATCH  /api/v1/cards/:cardId/move                      { targetColumnId, targetOrder, version }
GET    /api/v1/cards/:cardId/activities
```

### curl examples

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@demo.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@demo.com","password":"password123"}'

# Create workspace (replace TOKEN)
curl -X POST http://localhost:5000/api/v1/workspaces \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Workspace"}'
```

---

## Socket.IO Events

| Event (client → server) | Payload |
|---|---|
| `board:join` | `{ boardId, user }` |
| `board:leave` | `{ boardId }` |
| `card:move` | `{ boardId, cardId, fromColumnId, toColumnId, newOrder, version }` |
| `card:update` | `{ boardId, card }` |
| `card:create` | `{ boardId, card }` |
| `card:delete` | `{ boardId, cardId, columnId }` |
| `column:create` | `{ boardId, column }` |
| `column:update` | `{ boardId, column }` |
| `column:delete` | `{ boardId, columnId }` |

| Event (server → client) | Payload |
|---|---|
| `board:presence` | `{ users: [{ userId, username, avatar }] }` |
| `card:moved` | `{ cardId, fromColumnId, toColumnId, newOrder, version }` |
| `card:updated` | `{ card }` |
| `card:created` | `{ card }` |
| `card:deleted` | `{ cardId, columnId }` |
| `column:created` | `{ column }` |
| `column:updated` | `{ column }` |
| `column:deleted` | `{ columnId }` |

---

## Role-Based Access

| Role | Create/Edit/Delete cards | Move cards | View board |
|---|---|---|---|
| Owner | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ✅ |
| Viewer | ❌ (403) | ❌ (403) | ✅ |

---

## Features
- JWT auth with protected routes
- Workspaces with member invite by email
- Boards with Owner/Editor/Viewer roles (enforced server-side)
- Drag-and-drop columns and cards (dnd-kit) with fractional indexing
- Real-time sync via Socket.IO (< 500ms)
- Optimistic UI with rollback on server rejection
- Conflict detection via `version` field (409 on stale edits)
- Presence indicators (live avatars in board header)
- Card detail: markdown description, labels, due date, assignees, checklist, activity log
- Board search + filter by label
- Keyboard shortcuts (?, /, Esc)
- react-window virtualization for columns with > 100 cards
- Exponential backoff reconnection
- Responsive down to 375px
