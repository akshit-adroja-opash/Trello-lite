# Trello-lite MERN Codebase Bug Analysis

This report lists the bugs found in the frontend and backend of the Trello-lite application based on the five requested analysis criteria:
1. Frontend components/pages making no API calls but should.
2. Frontend API call URLs not matching backend Express routes (path/HTTP method mismatch).
3. Backend routes that are never called from the frontend (orphan routes).
4. Missing or wrong axios/fetch base URLs.
5. Improper CORS configuration in Express for the frontend origin.

---

## 1. Mapped Board Member Role Mismatch (Capitalization Issue)
* **File Name & Line Numbers:** 
  * Frontend: `frontend/src/components/Board/BoardMembersModal.jsx` (Lines 248, 252, 256)
  * Backend: `backend/src/models/Board.js` (Line 12)
* **What the Bug is:**
  In `BoardMembersModal.jsx`, the `<select>` options for member roles send lowercase values: `"viewer"`, `"editor"`, or `"owner"`.
  However, the backend `Board` schema defines the `role` enum with capitalized values: `['Owner', 'Admin', 'Editor', 'Viewer']`.
  When the frontend calls the patch endpoint to update a member's role, the backend attempts to save the lowercase string to the database. This triggers a Mongoose enum validation error and fails.
* **How to Fix it:**
  Capitalize the option values in the select element in `BoardMembersModal.jsx`:
  ```html
  <option value="Viewer">Viewer</option>
  <option value="Editor">Editor</option>
  <option value="Owner">Owner</option>
  ```

---

## 2. Wrong Database Fields Populated for My Tasks
* **File Name & Line Numbers:**
  * Backend: `backend/src/controllers/card.controller.js` (Lines 110–111)
  * Frontend: `frontend/src/pages/MyTasksPage.jsx` (where `card.board?.name` is rendered)
* **What the Bug is:**
  In the `getMyTasks` controller, the backend populates the `'board'` and `'column'` fields by requesting the `'title'` field:
  ```javascript
  .populate('board', 'title')
  .populate('column', 'title')
  ```
  However, the schemas for `Board` and `Column` do not have a `title` field; they use the field `name`. Because `title` is requested, Mongoose returns the populated objects with only the `_id` field.
  Consequently, in `MyTasksPage.jsx`, rendering `card.board?.name` fails to show the board and column names, showing `'—'` instead.
* **How to Fix it:**
  Update the populate calls in `backend/src/controllers/card.controller.js` to select `name` instead of `title`:
  ```javascript
  .populate('board', 'name')
  .populate('column', 'name')
  ```

---

## 3. Avatar Base URL String Concatenation Path Bug
* **File Name & Line Numbers:**
  * Frontend: `frontend/src/pages/ProfilePage.jsx` (Line 34)
* **What the Bug is:**
  In the helper function `getAvatarUrl()`, `ProfilePage.jsx` resolves the absolute path for local files with:
  ```javascript
  const backendBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  return `${backendBase}${user.avatar}`;
  ```
  If `user.avatar` starts without a slash (e.g., `uploads/avatar-123.jpg`), the resulting URL is concatenated directly (e.g., `http://localhost:5000uploads/avatar-123.jpg`), which is malformed.
* **How to Fix it:**
  Ensure a slash separates the base URL and the avatar path in `ProfilePage.jsx`:
  ```javascript
  return `${backendBase}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`;
  ```

---

## 4. Unimplemented Static Mock Interactions in Profile Page
* **File Name & Line Numbers:**
  * Frontend: `frontend/src/pages/ProfilePage.jsx` (Lines 248–279)
* **What the Bug is:**
  The Profile Page displays three cards: "Two-Factor Auth", "Connected Devices", and "Delete Account". These are styled as interactive buttons (`group cursor-pointer hover:bg-...`), but they do not make any API calls or navigate to functional views.
* **How to Fix it:**
  Implement endpoints on the backend for managing two-factor authentication, sessions, and account deletion, and integrate them in the profile page, or otherwise remove the mock interactive states if they are not planned.
