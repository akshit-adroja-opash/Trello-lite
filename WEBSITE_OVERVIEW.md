# Trello‑lite – Full‑stack Kanban Application Overview

## How the Application Works
1. **User Registration & Authentication**
   - Users register on **RegisterPage.jsx** (`POST /auth/register`). A role is chosen during registration (Admin Project Manager, Developer, Client).
   - Login via **LoginPage.jsx** (`POST /auth/login`) stores a JWT token in `localStorage`.
   - The token is attached to every request by the Axios instance (`src/api/axios.js`).
   - On app boot (`App.jsx`), the token is read, and `fetchMe` (`GET /auth/me`) loads the current user profile.

2. **Real‑time Communication**
   - After a successful login, a Socket.io client connects (`src/store/socketStore.js`).
   - The server (`backend/src/config/socket.js`) creates a room per board ID. Events like `new_notification` are emitted for comments, assignments, etc., and instantly reflected in the UI.

3. **Workspaces → Boards → Columns → Cards**
   - **Workspace** API (`workspace.api.js`) handles create, list, invite, role updates, and delete.
   - Inside a workspace, users can create **Boards** (`board.api.js`). Boards have a gradient background and belong to a workspace.
   - Each board contains **Columns** (`column.api.js`) which hold ordered **Cards** (`card.api.js`).
   - Cards can be created, edited, moved, commented on, and fetched. The controller also provides `getMyTasks` (cards assigned to the logged‑in user) and `getOverdueCount` for dashboard metrics.

4. **Dashboard & Pages**
   - **DashboardPage.jsx** loads the user’s workspaces, boards, and overdue task count, presenting a clean overview with quick navigation.
   - **BoardPage.jsx** displays columns and cards, supporting drag‑and‑drop between columns.
   - **ProfilePage.jsx** (newly added) lets users update username, password, and avatar via the `PATCH /auth/profile` endpoint.

5. **State Management**
   - Global auth state is managed by **Zustand** (`authstore.js`). It stores `user`, `token`, and loading flags, and provides actions like `login`, `register`, `fetchMe`, and `logout`.
   - Socket state is stored in `socketStore.js` to manage connection lifecycle.

## Complete Feature List
- **Authentication**: Register, login, logout, token refresh, profile update.
- **Role‑Based Access Control**: Owners, Admins, Editors, Viewers with UI visibility rules.
- **Workspace Management**: Create, edit, delete, invite members, assign roles.
- **Board Management**: Create, edit, delete, custom gradient backgrounds.
- **Column Management**: Add, rename, move columns.
- **Card Management**: CRUD, drag‑and‑drop, assign users, set due dates, add comments.
- **Notifications**: Real‑time board‑level notifications via Socket.io.
- **Over‑due Task Tracking**: `getMyTasks` and `getOverdueCount` endpoints for dashboard metrics.
- **Responsive UI**: Fluid grid, mobile‑friendly design, glass‑morphic cards, micro‑animations.
- **Premium Aesthetics**: Gradient backgrounds, subtle hover effects, custom Google Font (Inter), dark‑mode ready.
- **SEO Best Practices**: Proper `<title>`, meta descriptions, semantic HTML, single `<h1>` per page, unique IDs.
- **Error Handling**: Central toast notifications for API errors.
- **Future‑Ready Architecture**: Clear separation of concerns, reusable API layer, extensible store, and socket integration.

---

### Running the Project
```bash
# Install dependencies (run in project root)
npm install

# Backend
cd backend
npm run dev   # starts Express server on PORT 5000

# Frontend (in another terminal)
cd ../frontend
npm run dev   # Vite dev server at http://localhost:5173
```
Ensure the `.env` file in `backend` contains a valid `MONGODB_URI` and `JWT_SECRET`.

---

*This document provides a high‑level view of how Trello‑lite functions and the complete set of features it offers.*
