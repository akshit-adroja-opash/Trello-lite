# Trello-Lite: Codebase Audit & Gap Analysis Report

This document details the issues identified during a comprehensive audit of the Trello-lite codebase. The audit focused on finding mismatches between the frontend React components/pages and the backend Express routes, including orphan endpoints, incorrect base URL references, misconfigured CORS, and discrepancies in the role/permission systems.

---

## 1. Frontend Components Lacking API Calls / UI Implementation

### 1.1 Unimplemented Workspace Member & Role Management UI
* **Files**: 
  * `frontend/src/pages/DashboardPage.jsx`
  * `frontend/src/api/workspace.api.js` (Lines 14–26)
* **Description**: The frontend defines workspace member roles management API calls (`getMembers`, `updateMemberRole`, `removeMember`, `updateWorkspace`, `getOverdueCount`) but there is **no UI component** or page in the frontend that invokes these endpoints. While workspace invitation is implemented, workspace member role modification, member removal, workspace renaming, board member lists viewing, and board member role management are completely missing from the UI.
* **How to Fix**: 
  Create a "Workspace Settings" modal or tab inside `DashboardPage.jsx` accessible only to workspace owners (`Owner`/`admin`). This UI should load members using `getMembers` and allow updating roles or removing members.

### 1.2 Unimplemented Board Member & Role Management UI
* **Files**: 
  * `frontend/src/pages/BoardPage.jsx`
  * `frontend/src/api/board.api.js` (Lines 35–51)
* **Description**: Similar to the workspace-level endpoints, board-level member management routes (`getBoardMembers`, `addBoardMember`, `updateBoardMemberRole`) are declared in the board API helper but have no corresponding UI components to trigger them in `BoardPage.jsx`.
* **How to Fix**: 
  Implement a "Board Members" dropdown or modal in the board header. This component will fetch current board members using `getBoardMembers` and allow board owners (`Owner`) to add members or modify their board role.

### 1.3 Missing Workspace Overdue Count Summaries
* **Files**: 
  * `frontend/src/pages/DashboardPage.jsx`
  * `frontend/src/api/workspace.api.js` (Line 29)
* **Description**: While `workspace.api.js` contains a `getOverdueCount` method to retrieve the number of tasks past their due dates in a workspace, `DashboardPage.jsx` does not import or call this function to render an alert badge or status summary.
* **How to Fix**: 
  Import `getOverdueCount` into `DashboardPage.jsx`. Fetch the count for each workspace upon dashboard mount and render an indicator/badge next to the workspace title.

---

## 2. API Endpoint & URL Mismatches

### 2.1 Missing `/v1` Prefix in Shared Report Generation URL
* **Files**: 
  * `backend/src/controllers/reportController.js` (Line 133)
  * `backend/src/routes/report.routes.js`
* **Description**: The backend controller generates a shareable URL as:
  `http://localhost:5000/api/reports/shared/${token}`
  However, the reports router is mounted with the `/api/v1` namespace prefix inside `backend/app.js`:
  `app.use("/api/v1/reports", reportRouter);`
  The generated URL is missing the `/v1` namespace, so clicking it results in a `404 Not Found` error.
* **How to Fix**: 
  Modify the `shareReportLink` controller to construct the URL using the correct prefix and extract the request host dynamically:
  ```javascript
  const protocol = req.protocol;
  const host = req.get('host');
  const shareUrl = `${protocol}://${host}/api/v1/reports/shared/${token}`;
  ```

---

## 3. Orphan Backend Routes (Registered but Never Called)

### 3.1 Uncalled Workspace & Board Member Management Endpoints
* **Files**: 
  * `backend/src/routes/workspace.routes.js`
  * `backend/src/routes/board.routes.js`
* **Description**: The endpoints listed below exist on the backend but have no frontend integration:
  * `GET /api/v1/workspaces/:workspaceId/members` (getMembers)
  * `PATCH /api/v1/workspaces/:workspaceId/members/:memberId` (updateMemberRole)
  * `DELETE /api/v1/workspaces/:workspaceId/members/:memberId` (removeMember)
  * `PATCH /api/v1/workspaces/:workspaceId` (updateWorkspace)
  * `GET /api/v1/workspaces/:workspaceId/overdue-count` (getOverdueCount)
  * `PATCH /api/v1/boards/:boardId` (updateBoard)
  * `DELETE /api/v1/boards/:boardId` (deleteBoard)
  * `GET /api/v1/boards/:boardId/members` (getBoardMembers)
  * `POST /api/v1/boards/:boardId/members` (addBoardMember)
  * `PATCH /api/v1/boards/:boardId/members/:memberId` (updateBoardMemberRole)
* **How to Fix**: 
  Create settings views in the frontend client (as detailed in Section 1) to wire up these endpoints.

### 3.2 Uncalled Card Single Fetch Route
* **Files**: 
  * `backend/src/routes/card.routes.js`
* **Description**: The backend defines `GET /api/v1/cards/:cardId` (which maps to `getSingleCard` in `card.api.js`), but this is never invoked because board boards retrieve card data nested inside columns, rendering this route an orphan.
* **How to Fix**: 
  Keep for utility/future page links or remove if unnecessary to reduce API surface area.

### 3.3 Uncalled Report Sharing Routes
* **Files**: 
  * `backend/src/routes/report.routes.js`
* **Description**: The routes `POST /api/v1/reports/share/:reportId` and `GET /api/v1/reports/shared/:token` have no matching frontend triggers. The client only supports generating full and client reports via direct downloads.
* **How to Fix**: 
  Introduce a "Copy Share Link" option in the reports dashboard next to generated PDFs to leverage this background capability.

---

## 4. Hardcoded Base URLs / Env Fallback Inconsistencies

### 4.1 Hardcoded Port in ReportsPage.jsx
* **Files**: 
  * `frontend/src/pages/ReportsPage.jsx` (Lines 79 and 97)
* **Description**: When rendering generated PDF reports in a new browser tab, the frontend hardcodes the server base URL:
  `window.open("http://localhost:5000/" + normalizedPath, "_blank");`
  This breaks in staging/production setups where the backend runs on a different port or domain.
* **How to Fix**: 
  Construct the URL using Vite's environment config dynamically:
  ```javascript
  const backendBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  window.open(`${backendBase}/${normalizedPath}`, "_blank");
  ```

---

## 5. Express CORS Configuration Bugs

### 5.1 Lack of White Space Trimming in CORS Origin Split
* **Files**: 
  * `backend/app.js` (Lines 19–21)
* **Description**: In `backend/app.js`, CORS is initialized by splitting origins by comma:
  `const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");`
  If `process.env.CORS_ORIGIN` contains spaces between domains (e.g. `http://localhost:5173, http://127.0.0.1:5173`), the second origin is parsed with leading spaces (e.g. `' http://127.0.0.1:5173'`), failing CORS preflight requests.
* **How to Fix**: 
  Sanitize the origins array by trimming whitespace:
  ```javascript
  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
      .split(",")
      .map(origin => origin.trim())
      .filter(Boolean);
  ```

---

## 6. Critical Security & Role Discrepancies

### 6.1 Report Permissions & Global User Role Mismatch
* **Files**: 
  * `backend/src/models/User.js` (Line 25)
  * `backend/src/middleware/reportPermission.js` (Lines 4 and 17)
  * `frontend/src/components/ReportActions.jsx` (Lines 9–10)
* **Description**: The global role system contains conflicting naming definitions:
  * **User Model Schema**: Defines roles enum as `['admin', 'project_manager', 'developer']`.
  * **Report Permission Middleware**: Verifies permission checking `req.user.role === 'admin' || req.user.role === 'pm'`.
  * **The Mismatch**: Because the model stores the string `'project_manager'` while the middleware checks for `'pm'`, a user registered with the Project Manager role will be rejected with an `Access Denied` error when attempting to generate a report.
  * **Client Role**: The client report middleware checks for `req.user.role === 'client'`, but `'client'` is not even a valid value in the User model schema enum.
* **How to Fix**: 
  Standardize naming conventions to match. Change the checks inside `reportPermission.js` to reference `'project_manager'` instead of `'pm'`.

### 6.2 Browser Environment `require` Reference in rolePermissions.js
* **Files**: 
  * `frontend/src/utils/rolePermissions.js` (Line 50)
* **Description**: The file uses a Node.js CommonJS `require()` statement in the browser environment:
  `const useAuthStore = require('../store/authstore').default;`
  Since Vite React builds use ES module loaders in modern browsers, execution of this helper will crash with `ReferenceError: require is not defined`.
* **How to Fix**: 
  Replace the dynamic `require` with an static ES `import` statement at the top of the file:
  `import useAuthStore from '../store/authstore';`
