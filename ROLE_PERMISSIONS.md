# Role-Based Permissions — Trello Lite

## Role Name Mapping (Final)

| User System Role (`User.js`) | Board Role (`Board.js`) | Workspace Role (`Workspace.js`) |
|---|---|---|
| `admin` | `Owner` | `admin` |
| `project_manager` | `Admin` | `project_manager` |
| `developer` | `Editor` | `developer` |
| *(client/viewer)* | `Viewer` | `client` |

---

## Feature-wise Permission Table

| Feature | Owner (admin) | Admin (project_manager) | Editor (developer) | Viewer (client) |
|---|:---:|:---:|:---:|:---:|
| Workspace banana | ✅ | ❌ | ❌ | ❌ |
| Workspace delete karna | ✅ | ❌ | ❌ | ❌ |
| Member invite karna | ✅ | ❌ | ❌ | ❌ |
| Board banana | ✅ | ❌ | ❌ | ❌ |
| Board delete karna | ✅ | ❌ | ❌ | ❌ |
| Column banana | ✅ | ✅ | ❌ | ❌ |
| Column rename karna | ✅ | ✅ | ❌ | ❌ |
| Column delete karna | ✅ | ✅ | ❌ | ❌ |
| Card banana | ✅ | ✅ | ❌ | ❌ |
| Card edit karna | ✅ | ✅ | ❌ | ❌ |
| Card delete karna | ✅ | ✅ | ❌ | ❌ |
| Label add/remove | ✅ | ✅ | ❌ | ❌ |
| Due date change | ✅ | ✅ | ❌ | ❌ |
| Assignees change | ✅ | ✅ | ❌ | ❌ |
| Checklist add/remove | ✅ | ✅ | ❌ | ❌ |
| Koi bhi card drag & drop | ✅ | ✅ | ❌ | ❌ |
| Sirf apna assigned card drag & drop | ✅ | ✅ | ✅ | ❌ |
| Card detail read-only dekhna | ✅ | ✅ | ✅ | ✅ |

---

## Files Changed

| File | Kya Badla |
|---|---|
| `frontend/src/utils/rolePermissions.js` | Role comments update, `canCreateCard/EditCard/DeleteCard` → Admin+ only |
| `frontend/src/store/boardStore.js` | Default `boardRole` comment add kiya |
| `frontend/src/pages/DashboardPage.jsx` | "Create Workspace" button developer se hide, invite dropdown values fix |
| `backend/src/models/Board.js` | `Admin` enum add kiya (missing tha), mapping comment add |
| `backend/src/models/Workspace.js` | Roles rename: `editor→developer`, `viewer→client`, `member` hata diya |
| `backend/src/middleware/role.middleware.js` | Workspace→Board role mapping fix: `project_manager→Admin`, `developer→Editor` |
| `backend/src/routes/card.routes.js` | `Editor` hataya create/update/delete se, sirf move mein rakha |
| `backend/src/routes/column.routes.js` | `Editor` hataya createColumn se |
| `backend/src/controllers/workspace.controller.js` | `developer` role block kiya workspace create karne se |
