# Frontend ↔ Backend Gap Analysis

## Legend
- ✅ Connected & Working
- ❌ Not Connected / Missing
- ⚠️ Partially Connected

---

## 1. AUTH — `backend/src/routes/auth.routes.js`

| Backend Route | Frontend API | Page/Component Used | Status |
|---|---|---|---|
| `POST /auth/register` | `auth.api.js → registerUser` | `RegisterPage.jsx` | ✅ |
| `POST /auth/login` | `auth.api.js → loginUser` | `LoginPage.jsx` | ✅ |
| `GET /auth/me` | `auth.api.js → getMe` | `App.jsx` | ✅ |
| `POST /auth/logout` | `auth.api.js → logoutUser` | `DashboardPage.jsx` | ✅ |
| `PATCH /auth/profile` | `auth.api.js → updateProfile` | ❌ **No ProfilePage exists** | ❌ |

**Missing:**
- `updateProfile` API function exists in `auth.api.js` but **no ProfilePage.jsx** is created
- No UI anywhere to call this endpoint (username change, password change, avatar upload)

---

## 2. WORKSPACE — `backend/src/routes/workspace.routes.js`

| Backend Route | Frontend API | Page/Component Used | Status |
|---|---|---|---|
| `POST /workspaces` | `workspace.api.js → createWorkspace` | `DashboardPage.jsx` | ✅ |
| `GET /workspaces` | `workspace.api.js → getWorkspaces` | `DashboardPage.jsx` | ✅ |
| `POST /:id/invite` | `workspace.api.js → inviteMember` | `DashboardPage.jsx` | ✅ |
| `GET /:id/members` | `workspace.api.js → getMembers` | ❌ **Never called in any page** | ❌ |
| `PATCH /:id/members/:memberId` | `workspace.api.js → updateMemberRole` | ❌ **Never called in any page** | ❌ |
| `DELETE /:id/members/:memberId` | `workspace.api.js → removeMember` | ❌ **Never called in any page** | ❌ |
| `PATCH /:id` | `workspace.api.js → updateWorkspace` | ❌ **Never called in any page** | ❌ |
| `DELETE /:id` | `workspace.api.js → deleteWorkspace` | `DashboardPage.jsx` | ✅ |
| `GET /:id/overdue-count` | `workspace.api.js → getOverdueCount` | ❌ **Never called in any page** | ❌ |

**Missing:**
- `getMembers` — API ready, no UI to list workspace members separately
- `updateMemberRole` — API ready, no UI to change a member's role after invite
- `removeMember` — API ready, no UI to remove a member from workspace
- `updateWorkspace` — API ready, no UI to rename/edit workspace description
- `getOverdueCount` — API ready, never called on Dashboard to show overdue badge

---

## 3. BOARD — `backend/src/routes/board.routes.js`

| Backend Route | Frontend API | Page/Component Used | Status |
|---|---|---|---|
| `POST /boards` | `board.api.js → createBoard` | `DashboardPage.jsx` | ✅ |
| `GET /boards/workspace/:id` | `board.api.js → getBoardsByWorkspace` | `DashboardPage.jsx` | ✅ |
| `GET /boards/:boardId` | `board.api.js → getSingleBoard` | `BoardPage.jsx` | ✅ |
| `PATCH /boards/:boardId` | `board.api.js → updateBoard` | ❌ **Never called in any page** | ❌ |
| `DELETE /boards/:boardId` | `board.api.js → deleteBoard` | ❌ **Never called in any page** | ❌ |
| `GET /boards/:boardId/members` | `board.api.js → getBoardMembers` | ❌ **Never called in any page** | ❌ |
| `POST /boards/:boardId/members` | ❌ **Missing in board.api.js** | ❌ **No UI** | ❌ |
| `PATCH /boards/:boardId/members/:memberId` | `board.api.js → updateBoardMemberRole` | ❌ **Never called in any page** | ❌ |

**Missing:**
- `addBoardMember` — backend route `POST /boards/:boardId/members` exists but **no frontend API function** and **no UI**
- `updateBoard` — API ready, no UI to rename board or change background
- `deleteBoard` — API ready, no UI button anywhere
- `getBoardMembers` — API ready, never used in BoardPage
- `updateBoardMemberRole` — API ready, no UI

---

## 4. COLUMN — `backend/src/routes/column.routes.js`

| Backend Route | Frontend API | Page/Component Used | Status |
|---|---|---|---|
| `POST /columns` | `column.api.js → createColumn` | `BoardPage.jsx` | ✅ |
| `GET /columns/board/:boardId` | `column.api.js → getColumnsByBoard` | `BoardPage.jsx` | ✅ |
| `PATCH /columns/reorder` | `column.api.js → reorderColumn` | `BoardPage.jsx` | ✅ |
| `PATCH /columns/:columnId` | `column.api.js → updateColumn` | `ColumnItem.jsx` | ✅ |
| `DELETE /columns/:columnId` | `column.api.js → deleteColumn` | `ColumnItem.jsx` | ✅ |

**Status: ✅ Fully Connected**

---

## 5. CARD — `backend/src/routes/card.routes.js`

| Backend Route | Frontend API | Page/Component Used | Status |
|---|---|---|---|
| `POST /cards` | `card.api.js → createCard` | `BoardPage.jsx` | ✅ |
| `GET /cards/column/:columnId` | `card.api.js → getCardsByColumn` | `BoardPage.jsx` | ✅ |
| `GET /cards/my-tasks` | ❌ **Missing in card.api.js** | `MyTasksPage.jsx` (uses axios directly) | ⚠️ |
| `GET /cards/:cardId` | `card.api.js → getSingleCard` | Not used in any page | ⚠️ |
| `GET /cards/:cardId/activities` | `card.api.js → getCardActivities` | `CardDetail.jsx` | ✅ |
| `POST /cards/:cardId/comments` | `card.api.js → addComment` | `CardDetail.jsx` | ✅ |
| `PATCH /cards/:cardId` | `card.api.js → updateCard` | `CardDetail.jsx` | ✅ |
| `DELETE /cards/:cardId` | `card.api.js → deleteCard` | `CardDetail.jsx` | ✅ |
| `PATCH /cards/:cardId/move` | `card.api.js → moveCard` | `BoardPage.jsx` | ✅ |

**Missing:**
- `GET /cards/my-tasks` — `MyTasksPage.jsx` calls it directly via `API.get('/cards/my-tasks')` instead of using a proper API wrapper function in `card.api.js`
- `MyTasksPage` route `/my-tasks` is **not registered in `App.jsx`** — page exists but is unreachable
- `getSingleCard` — function exists in `card.api.js` but never called anywhere in frontend

---

## 6. NOTIFICATIONS — `backend/src/controllers/notification.controller.js`

| Backend Route | Frontend API | Page/Component Used | Status |
|---|---|---|---|
| `GET /notifications` | ❌ **`notification.api.js` file does not exist** | `notificationStore.js` tries to import it | ❌ |
| `PATCH /notifications/:id/read` | ❌ **`notification.api.js` file does not exist** | `notificationStore.js` tries to import it | ❌ |
| `PATCH /notifications/read-all` | ❌ **`notification.api.js` file does not exist** | `notificationStore.js` tries to import it | ❌ |

**Missing:**
- `notification.api.js` file **does not exist at all** — `notificationStore.js` imports from `../api/notification.api` which will throw a runtime error
- Notification routes are **not registered in `app.js`** — no `app.use('/api/v1/notifications', notificationRoutes)` line exists
- `NotificationBell` component exists but is **never rendered** in `App.jsx`, `DashboardPage.jsx`, or `BoardPage.jsx`

---

## 7. ACTIVITY — `backend/src/routes/activity.routes.js`

| Backend Route | Frontend API | Page/Component Used | Status |
|---|---|---|---|
| `GET /activities/board/:boardId` | No API wrapper (uses axios directly) | `ActivitySidebar.jsx` | ⚠️ |

**Missing:**
- No `activity.api.js` file — `ActivitySidebar.jsx` calls `API.get('/activities/board/${boardId}')` directly
- ActivitySidebar has **no real-time updates** — only fetches on mount, no socket listener

---

## 8. BACKEND — Registered but Missing in `app.js`

| Controller | Routes File | Registered in app.js | Status |
|---|---|---|---|
| `notification.controller.js` | No routes file exists | ❌ Not registered | ❌ |
| `upload.middleware.js` | Used in auth routes | Static files `/uploads` not served | ⚠️ |

---

## Summary — What Needs to Be Created/Fixed

### 🔴 Critical (App will crash / feature completely broken)

| # | What | Fix |
|---|---|---|
| 1 | `notification.api.js` missing | Create `frontend/src/api/notification.api.js` |
| 2 | Notification routes not in `app.js` | Add `app.use('/api/v1/notifications', notificationRoutes)` |
| 3 | Notification routes file missing | Create `backend/src/routes/notification.routes.js` |
| 4 | `MyTasksPage` not in `App.jsx` routes | Add `<Route path="/my-tasks" element={<MyTasksPage />} />` |

### 🟡 Medium (Feature exists but not wired)

| # | What | Fix |
|---|---|---|
| 5 | `NotificationBell` never rendered | Add to `DashboardPage.jsx` and `BoardPage.jsx` header |
| 6 | `addBoardMember` missing in `board.api.js` | Add `POST /boards/:boardId/members` function |
| 7 | `getOverdueCount` never called | Call in `DashboardPage.jsx` per workspace |
| 8 | `updateWorkspace` never called | Add edit workspace UI in `DashboardPage.jsx` |
| 9 | `removeMember` / `updateMemberRole` never called | Add member management UI |
| 10 | `updateBoard` / `deleteBoard` never called | Add board settings UI in `BoardPage.jsx` |
| 11 | `MyTasksPage` uses raw axios instead of api wrapper | Add `getMyTasks` to `card.api.js` |
| 12 | ActivitySidebar not real-time | Add socket listener for new activities |

### 🟢 Low (Nice to have)

| # | What | Fix |
|---|---|---|
| 13 | `ProfilePage` missing | Create page using existing `updateProfile` API |
| 14 | `getSingleCard` never used | Use in CardDetail instead of passing card as prop |
| 15 | Avatar uploads — `/uploads` not served statically | Add `app.use('/uploads', express.static('uploads'))` in `app.js` |
