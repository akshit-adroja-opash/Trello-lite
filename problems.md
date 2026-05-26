# Trello-Lite Full-Stack Security and Integration Audit

This document presents the findings of a comprehensive audit of the Trello-lite codebase. The audit inspected the frontend-backend connection, route mapping, API invocation, configuration correctness, and CORS configurations.

---

## 1. Missing API Integrations (Hardcoded UI Elements)

### Profile Page Settings Placeholders
* **File:** `frontend/src/pages/ProfilePage.jsx`
* **Line Range:** [259–278](file:///c:/Users/Admin/OneDrive/Desktop/Trello-lite/frontend/src/pages/ProfilePage.jsx#L259-L278)
* **The Issue:** The "Two-Factor Auth" and "Connected Devices" settings panels are styled as interactive buttons but are completely static and hardcoded. They display dummy data (`"Enhanced security"`, `"3 active sessions"`) and lack `onClick` handlers or corresponding backend integration.
* **How to Fix:** 
  1. *Immediate mitigation:* Disable hover pointer cues/effects or label them clearly as `(Coming Soon)` to align user expectations.
  2. *Full integration:* Create backend endpoints for managing Two-Factor Authentication (`/api/v1/auth/2fa`) and fetching active sessions (`/api/v1/auth/sessions`), and update `ProfilePage.jsx` to fetch and render this state dynamically.

---

## 2. Route Mismatches (HTTP Methods / Paths)

* **Status:** **No Issues Found**
* **Analysis:** All frontend Axios calls defined in `frontend/src/api/` match their corresponding Express router definitions in `backend/src/routes/` exactly regarding paths, URL parameters, and HTTP verbs (e.g., `GET`, `POST`, `PATCH`, `DELETE`).

---

## 3. Orphan Backend Routes & API Wrappers

### Redundant Frontend API Wrapper function
* **File:** `frontend/src/api/reportService.js`
* **Line Range:** [16–19](file:///c:/Users/Admin/OneDrive/Desktop/Trello-lite/frontend/src/api/reportService.js#L16-L19)
* **The Issue:** The `downloadSharedReport` function:
  ```javascript
  export const downloadSharedReport = async (token) => {
    const res = await API.get(`/reports/shared/${token}`, { responseType: 'blob' });
    return res.data;
  };
  ```
  is exported but never imported or called anywhere in the React app. When a user generates a shareable link, the backend generates an absolute URL pointing directly to the Express endpoint `/api/v1/reports/shared/:token` which returns a direct download stream (`res.download(report.pdfUrl)`).
* **How to Fix:** Keep the backend Express route active (as it handles the direct downloads for external users), but delete the unused `downloadSharedReport` wrapper function from `frontend/src/api/reportService.js` to keep the frontend API module clean.

---

## 4. Base URL Configuration and Environment Variables

* **Status:** **No Issues Found**
* **Analysis:** All API and Socket connections are dynamically driven by environment variables (`VITE_API_URL` and `VITE_SOCKET_URL`) with fallback defaults matching standard development ports. Vite's `import.meta.env` system is used correctly rather than Create React App's `process.env.REACT_APP_API_URL`.

---

## 5. CORS Configurations

* **Status:** **No Issues Found**
* **Analysis:** CORS settings in both Express (`backend/app.js`) and Socket.io (`backend/src/config/socket.js`) utilize `process.env.CORS_ORIGIN` (defaulting to `http://localhost:5173`) with `credentials: true`. The middleware correctly allows cross-origin requests from the React application client.
