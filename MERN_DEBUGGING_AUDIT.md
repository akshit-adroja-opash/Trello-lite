# Comprehensive MERN Stack Debugging Audit Report
**Project:** Trello-lite  
**Date:** July 2026  
**Stack:** MongoDB, Express.js, React.js, Node.js  

---

## Executive Summary
This document provides a systematic, line-by-line audit of the Trello-lite codebase across five critical architectural and debugging categories:
1. **Hardcoded Frontend Data / Missing API Calls**
2. **Frontend API Call Mapping to Backend Routes**
3. **Orphan Backend Routes (Unused by Frontend)**
4. **Environment Variables & Localhost Fallbacks**
5. **CORS & WebSocket Security Configurations**

---

## Category 1: Hardcoded Frontend Data / Missing API Calls

### 1. `frontend/src/pages/ReportsPage.jsx`
* **Line Numbers:** Lines 215–249 and Line 194
* **Bug Description:** The component merges real database reports (`recentReports`) with a hardcoded static array of 4 mock report objects (`_id: "mock-1"`, `"mock-2"`, etc.). When a user clicks the download icon on any of these static entries, line 194 executes `toast.info("This is a placeholder report entry.");` instead of fetching or downloading a real report.
* **How to fix:**
  Remove the hardcoded static array from `mergedReports` so that only real reports generated from the API are displayed:
  ```javascript
  // Replace lines 215-249 in ReportsPage.jsx:
  const mergedReports = recentReports || [];
  ```

---

## Category 2: Frontend API Call Mapping to Backend Routes

### ✔ All API Routes Perfectly Align
* **Audit Result:** We performed a verification comparing all frontend Axios service calls in `frontend/src/api/*.js` against all Express routes mounted in `backend/src/routes/*.js`.
* **Conclusion:** There are **0 mismatches** in paths or HTTP methods. All `GET`, `POST`, `PATCH`, and `DELETE` requests in `auth.api.js`, `board.api.js`, `card.api.js`, `column.api.js`, `workspace.api.js`, `dashboard.api.js`, `activity.api.js`, `notification.api.js`, and `reportService.js` match their Express backend definitions.

---

## Category 3: Orphan Backend Routes (Never Called by Frontend)

All previously identified orphan routes have been integrated into the frontend API layer or verified as already in use:

### 1. `backend/src/routes/auth.routes.js`
* **Line Number:** Line 32
* **Route:** `POST /api/v1/auth/refresh-token` (`refreshAccessToken`)
* **Resolution:** [RESOLVED] Added `refreshAccessToken` export in `auth.api.js` and configured an Axios response interceptor in `axios.js` to automatically refresh access tokens when a `401 Unauthorized` response is encountered.

### 2. `backend/src/routes/workspace.routes.js`
* **Line Number:** Line 18
* **Route:** `GET /api/v1/workspaces/:workspaceId/activity` (`getWorkspaceActivity`)
* **Resolution:** [RESOLVED] Exported `getWorkspaceActivity(workspaceId)` function in `workspace.api.js`.

### 3. `backend/src/routes/board.routes.js`
* **Line Numbers:** Lines 29–30
* **Routes:** 
  * `POST /api/v1/boards/:boardId/members` (`addBoardMember`)
  * `DELETE /api/v1/boards/:boardId/members/:userId` (`removeBoardMember`)
* **Resolution:** [VERIFIED] Confirmed that `BoardMembersModal.jsx` correctly imports and calls `addBoardMember` and `removeBoardMember` for atomic member management.

### 4. `backend/src/routes/column.routes.js`
* **Line Number:** Line 14
* **Route:** `DELETE /api/v1/columns/:id` (`deleteColumn`)
* **Resolution:** [VERIFIED] Confirmed that `deleteColumn` is already exported in `column.api.js` and actively used in `ColumnItem.jsx` (line 152).

### 5. `backend/src/routes/card.routes.js`
* **Line Number:** Line 34
* **Route:** `GET /api/v1/cards/board/:boardId/templates` (`getBoardTemplates`)
* **Resolution:** [VERIFIED] Confirmed that `getBoardTemplates` is already exported in `card.api.js` (line 53).

### 6. `backend/src/routes/activity.routes.js`
* **Line Numbers:** Lines 11 & 13
* **Routes:** 
  * `GET /api/v1/activities/workspace/:workspaceId` (`getWorkspaceActivities`)
  * `GET /api/v1/activities/user/:userId` (`getUserActivities`)
* **Resolution:** [RESOLVED] Exported `getWorkspaceActivities` and `getUserActivities` functions in `activity.api.js`.

---

## Category 4: Hardcoded Localhost Fallbacks & Base URLs

While `VITE_API_URL` is used as the primary environment variable, several components hardcode `http://localhost:5000` as a fallback. If `VITE_API_URL` is missing or misconfigured in production (e.g. on Vercel), the app will silently attempt to make requests to the user's local machine.

### 1. `frontend/src/api/axios.js`
* **Line Number:** Line 4
* **Bug Description:** 
  ```javascript
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  ```
* **How to fix:** Ensure production environment variables explicitly include `VITE_API_URL=https://your-backend.vercel.app/api/v1`. To prevent silent CORS/network failures in production if the variable is forgotten, log a clear warning or throw an error in non-development environments when `VITE_API_URL` is undefined.

### 2. `frontend/src/components/Card/CardDetail.jsx`
* **Line Number:** Line 233
* **Bug Description:** When resolving attachment URLs, the component hardcodes localhost:
  ```javascript
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  return `${apiUrl.replace('/api/v1', '')}${path}`;
  ```
* **How to fix:** Export a centralized base server URL helper from `axios.js` (e.g., `export const SERVER_URL = API.defaults.baseURL.replace('/api/v1', '');`) and import it here instead of duplicating hardcoded strings.

### 3. `frontend/src/UI/Avatar.jsx`
* **Line Number:** Line 8
* **Bug Description:** Duplicates the exact same hardcoded localhost string to construct avatar image paths:
  ```javascript
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  ```
* **How to fix:** Import the centralized `SERVER_URL` constant from `api/axios.js`.

### 4. `frontend/src/pages/ReportsPage.jsx`
* **Line Number:** Line 13
* **Bug Description:** Hardcodes localhost for opening generated PDF reports:
  ```javascript
  const backendBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  ```
* **How to fix:** Use the centralized `SERVER_URL` helper from `api/axios.js`.

### 5. `frontend/src/pages/ProfilePage.jsx`
* **Line Number:** Line 16
* **Bug Description:** Hardcodes localhost for previewing profile avatar uploads:
  ```javascript
  const backendBase = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  ```
* **How to fix:** Replace with the centralized `SERVER_URL` helper from `api/axios.js`.

---

## Category 5: CORS & WebSocket Origin Configuration

### 1. `backend/app.js` & `backend/src/config/socket.js`
* **Line Numbers:** `backend/app.js` (Lines 23–27) & `backend/src/config/socket.js` (Lines 6–8)
* **Current Configuration:**
  ```javascript
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];
  ```
* **Bug Description:** The backend correctly splits `CORS_ORIGIN` by commas and checks `allowedOrigins.includes(origin)`. However, in Vercel preview environments, frontend deployment URLs change dynamically (e.g., `https://trello-lite-git-main-username.vercel.app`). If `CORS_ORIGIN` only contains your static production URL, preview deployments will fail with CORS blocked errors.
* **How to fix:**
  In `backend/app.js` and `backend/src/config/socket.js`, support regex matching or Vercel preview domains in your origin validator:
  ```javascript
  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps or curl)
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  };
  ```
