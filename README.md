# Trello‑lite – Full‑stack Kanban Application

## 🌟 Overview
Trello‑lite is a modern, premium‑looking Kanban board application built with a **React + Vite** frontend and an **Express (Node.js)** backend. It offers a rich, responsive UI with glass‑morphic gradients, smooth micro‑animations, and a dark‑mode‑ready design. The app supports multi‑user workspaces, role‑based access control, real‑time notifications via **Socket.io**, and advanced task‑tracking features such as **over‑due task metrics**.

---

## 📦 Tech Stack
| Layer | Technology |
|-------|------------|
| **Frontend** | React, Vite, Tailwind‑CSS (custom), React‑Router, Zustand for state, React‑Hot‑Toast, Google Fonts (Inter) |
| **Backend** | Node.js (v24), Express, Mongoose (MongoDB), JWT authentication, Socket.io |
| **Database** | MongoDB (Atlas or local) |
| **API Client** | Axios wrapper (`src/api/*.js`) |
| **Build / Dev** | npm scripts (`npm run dev`), ESLint, Prettier |

---

## 🔐 Authentication & Authorization
1. **Registration** – Users choose a role (Admin Project Manager, Developer, Client) during sign‑up.
2. **Login** – Email & password only (role is stored from registration).
3. **JWT** – Secure token stored in **localStorage**; attached to every request via Axios interceptor.
4. **Role‑Based Access** – Middleware (`requireBoardRole`) validates that the current user has a permitted role (Owner, Admin, Editor, Viewer) before allowing actions such as creating, updating, or deleting cards/boards.

---

## 🗂️ Core Data Model
- **Workspace** – Top‑level container; holds multiple boards. Includes members with assigned roles.
- **Board** – Kanban board with customizable gradient background. Contains columns.
- **Column** – Holds ordered cards.
- **Card** – Task item with title, description, due date, assignees, comments, and activity log.
- **Notification** – Real‑time events (card comment, assignment, etc.) stored for later viewing.

---

## 📋 Feature Set
| Feature | Description |
|---------|-------------|
| **Workspace Management** | Create, update, delete workspaces; invite members; role assignment per member. |
| **Board Management** | Create boards with gradient backgrounds, edit board details, delete boards. |
| **Column Management** | Add, rename, move columns within a board. |
| **Card CRUD** | Create, read, update, delete cards; drag‑and‑drop between columns. |
| **Comments & Activity** | Add comments to cards; activity history displayed on card view. |
| **Over‑due Tasks** | `getMyTasks` endpoint returns cards assigned to the logged‑in user; dashboard shows total overdue count per workspace (`getOverdueCount`). |
| **Real‑time Notifications** | Socket.io broadcasts events like `BOARD_COMMENT`; UI shows toast and notification list. |
| **Role‑Based UI** | Certain UI controls (invite, delete workspace/board) appear only for owners/admins. |
| **Dashboard** | Summarizes workspaces, boards, and overdue tasks; provides quick navigation. |
| **Responsive Design** | Mobile‑friendly layout, fluid grid, and touch‑optimized interactions. |
| **Premium Aesthetics** | Gradient backgrounds, glass‑morphism cards, subtle hover effects, micro‑animations, and custom Google Font (`Inter`). |
| **Error Handling** | Centralized error toast messages; API errors displayed inline. |
| **SEO** | Proper `<title>`, meta descriptions, semantic HTML, single `<h1>` per page, and unique IDs for interactive elements. |

---

## 🛠️ How It Works – Request Flow
1. **User Action** (e.g., create a card) triggers a frontend API call via `src/api/card.api.js`.
2. **Axios** adds the JWT token, sends the request to `backend/src/routes/card.routes.js`.
3. **Express Router** validates JWT (`verifyJWT`) and role (`requireBoardRole`).
4. **Controller** (`card.controller.js`) performs DB operations with Mongoose.
5. **Socket.io** (if applicable) emits a real‑time event to all users in the board’s room.
6. Frontend listeners (`socket.js`) receive the event and update UI instantly.

---

## 📁 Project Structure (High‑Level)
```
Trello-lite/
├─ backend/
│  ├─ src/
│  │  ├─ controllers/   # auth, workspace, board, column, card
│  │  ├─ models/        # Mongoose schemas
│  │  ├─ routes/        # Express routers
│  │  ├─ middleware/    # JWT, role, file upload
│  │  └─ index.js       # Server entry, socket.io init
│  └─ package.json
├─ frontend/
│  ├─ src/
│  │  ├─ api/          # Axios wrappers (auth, workspace, board, ...)
│  │  ├─ components/   # Reusable UI elements (ColumnItem, CardItem, ...)
│  │  ├─ pages/        # DashboardPage, BoardPage, LoginPage, RegisterPage
│  │  ├─ store/        # Zustand store (authstore)
│  │  ├─ App.jsx        # Route definitions, auth guard
│  │  └─ index.js
│  └─ vite.config.js
├─ README.md            # <‑‑ This file
└─ .gitignore
```

---

## 🚀 Running the Application
```bash
# Clone repo (already done)
cd Trello-lite
# Install dependencies
npm install               # both backend & frontend use the same node_modules folder
# Start backend
cd backend
npm run dev   # runs node index.js (Express server on PORT 5000)
# In a new terminal, start frontend
cd ../frontend
npm run dev   # Vite dev server (http://localhost:5173)
```
Make sure MongoDB connection string is set in `.env` (backend) and the API base URL matches the backend URL.

---

## 📚 Future Enhancements (Roadmap)
- **Dark Mode toggle** with CSS variables.
- **Drag‑and‑drop** column reordering.
- **Search & filter** across cards and boards.
- **Email notifications** for overdue tasks.
- **Export / import** board data (JSON).
- **Performance optimizations** – pagination for activity logs, lazy loading of large boards.

---

## 📜 License & Contributions
The project is open‑source under the MIT License. Feel free to fork, submit pull requests, or open issues for bugs and feature requests.

---

*Created with love by the Trello‑lite development team – a premium‑grade Kanban solution.*
