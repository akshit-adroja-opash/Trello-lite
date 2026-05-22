# Trello-lite Codebase Bug Analysis Report

This report documents the security, integration, and routing analysis for the MERN stack of **Trello-lite**. The codebase was scanned for hardcoded frontend data, API path mismatches, orphaned backend routes, environment variable issues, and CORS configurations.

---

## Summary of Findings

| Category | Issue Description | Severity | File(s) & Line(s) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **API Mismatch** | Mismatch: Board member removal API has no backend route/controller | High | `frontend/src/api/board.api.js` (L43-46)<br>`backend/src/routes/board.routes.js` | Resolved |
| **Frontend Bug** | Missing frontend route for `/workspace-members` in sidebar | Medium | `frontend/src/components/Layout/DashboardSidebar.jsx` (L170-180)<br>`frontend/src/App.jsx` | Resolved |
| **Frontend Bug** | Wrong argument types passed to `updateBoardMemberRole` | Medium | `frontend/src/components/Board/BoardMembersModal.jsx` (L88) | Resolved |
| **API Fallback** | Safe environment variable fallbacks used for `localhost` | Info | `frontend/src/api/axios.js` (L4)<br>`frontend/src/store/socketStore.js` (L4) | Verified Safe |
| **CORS Policy** | Properly configured dynamic origin matching array | Info | `backend/app.js` (L21-30) | Verified Safe |

---

## Detailed Bug Reports & Recommendations

### 1. Board Member Removal Mismatch (High Severity)
* **What the Bug is:**
  The frontend client defines `removeBoardMember` in `board.api.js` which initiates a `DELETE /boards/:boardId/members/:memberId` call. However, the backend router `board.routes.js` doesn't register a corresponding route, and `board.controller.js` does not contain the code or method to process member removals.
* **How to Fix it:**
  1. Add the member removal controller method to `backend/src/controllers/board.controller.js`:
     ```javascript
     export const removeBoardMember = async (req, res, next) => {
         try {
             const { boardId, memberId } = req.params;
             const board = await Board.findById(boardId);
             if (!board) return next(new ApiError(404, 'Board not found'));
             if (board.owner.toString() !== req.user._id.toString())
                 return next(new ApiError(403, 'Only the owner can remove members'));

             board.members = board.members.filter(m => m.user.toString() !== memberId);
             await board.save();
             res.status(200).json({ status: 'success', data: { board } });
         } catch (error) { next(error); }
     };
     ```
  2. Register the route in `backend/src/routes/board.routes.js`:
     ```javascript
     import { ..., removeBoardMember } from '../controllers/board.controller.js';
     // ...
     router.delete('/:boardId/members/:memberId', requireBoardRole('Owner'), removeBoardMember);
     ```

---

### 2. Sidebar Navigation Dead Link (Medium Severity)
* **What the Bug is:**
  In `DashboardSidebar.jsx`, a `Team Members` link is rendered pointing to `/workspace-members` if the user is authorized to manage the workspace. However, this route is not registered inside `App.jsx`, causing a redirect to the dashboard page whenever clicked.
* **How to Fix it:**
  Workspace member management is already fully integrated into the `WorkspaceSettingsModal.jsx` component. Therefore, the `/workspace-members` link in `DashboardSidebar.jsx` is duplicate/redundant.
  * **Option A (Remove Redundant Link):** Remove the `/workspace-members` link code block from `DashboardSidebar.jsx` (L169-180).
  * **Option B (Register New Route):** Create a dedicated page for workspace members, import it, and register the route in `frontend/src/App.jsx`.

---

### 3. Incorrect Role Update Payload Signature (Medium Severity)
* **What the Bug is:**
  In `BoardMembersModal.jsx` (line 88), the select change handler invokes `updateBoardMemberRole(board._id, memberId, role)`. However, `updateBoardMemberRole` in `board.api.js` takes `(boardId, memberId, data)` where the third parameter is treated as the request body object. Passing a plain string causes Axios to treat it as config, leaving the request body payload undefined.
* **How to Fix it:**
  Modify `BoardMembersModal.jsx` line 88 to pass the role as an object:
  ```diff
  -            await updateBoardMemberRole(
  -                board._id,
  -                memberId,
  -                role
  -            );
  +            await updateBoardMemberRole(
  +                board._id,
  +                memberId,
  +                { role }
  +            );
  ```

---

### 4. Direct Downloads vs. Orphaned Routes (Info)
* **Status:** Checked
* **Details:** The route `GET /shared/:token` inside `report.routes.js` maps to `downloadSharedReport` which initiates file downloads on the client. Because it is intended to be called directly by clients opening shared URLs, it does not need a corresponding fetch/axios mapping on the frontend and is **not** an orphan route.

---

### 5. CORS Configurations (Info)
* **Status:** Verified Secure
* **Details:** CORS is correctly set up dynamically in `backend/app.js` using dynamic origin resolution, splitting comma-separated URLs in `process.env.CORS_ORIGIN` and defaulting to `http://localhost:5173`. Credentials flags are enabled both on backend CORS middleware and frontend socket client endpoints.
