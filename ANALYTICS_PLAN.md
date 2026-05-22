# Analytics Dashboard Feature — Implementation Plan

This document outlines the architecture, file creation list, code changes, and role-based access configurations required to introduce an interactive, premium Analytics Dashboard to the Trello-lite platform.

---

## 1. Feature Specifications & UI Design
The Analytics Dashboard will serve as a visual control center. It will highlight:
1. **Key Performance Indicators (KPIs)**: Total lists, cards, completed tasks ratio, and overdue tasks count.
2. **Workload Distribution Chart**: Horizontal bar graph illustrating cards assigned to each member.
3. **Task Status Distribution**: Circular donut graph illustrating cards across status columns (To Do, In Progress, Review, Done).
4. **Productivity Timelines**: Line chart showing weekly/daily completed task throughput.

---

## 2. File Creation List

### 2.1 Backend Services

#### 📂 `backend/src/controllers/analyticsController.js`
Handles MongoDB aggregation pipelines to retrieve dashboard data.
* **`getWorkspaceAnalytics`**:
  * Extracts card status percentages (using column groupings).
  * Counts overdue tasks based on `dueDate` (< current date and not in a column containing "Done").
  * Calculates workload distributions (aggregates cards grouping by `assignedTo`).
  * Generates completion timeline counts over the last 30 days.

#### 📂 `backend/src/routes/analytics.routes.js`
Registers router endpoints:
```javascript
import { Router } from "express";
import { getWorkspaceAnalytics } from "../controllers/analyticsController.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.get("/workspace/:workspaceId", getWorkspaceAnalytics);

export default router;
```

---

### 2.2 Frontend Client

#### 📂 `frontend/src/api/analytics.api.js`
Wired to make GET requests to the backend:
```javascript
import API from "./axios";

export const getWorkspaceAnalytics = async (workspaceId) => {
  const res = await API.get(`/analytics/workspace/${workspaceId}`);
  return res.data;
};
```

#### 📂 `frontend/src/pages/AnalyticsPage.jsx`
* A layout nested under the standard page frame with `DashboardSidebar` and `Navbar`.
* Renders animated, premium stats cards and custom-styled SVG charts.
* Uses workspace switches so users can toggle between different workspaces dynamically.

---

## 3. Files to Update

### 3.1 Backend Server Hookup

#### 🛠️ `backend/app.js`
Mount the newly created analytics router:
```javascript
import analyticsRoutes from "./src/routes/analytics.routes.js";
// ...
app.use("/api/v1/analytics", analyticsRoutes);
```

---

### 3.2 Frontend Routes & Navigation

#### 🛠️ `frontend/src/App.jsx` (or routing file)
Import the new `AnalyticsPage` and mount it as a protected route at `/analytics` or `/workspace/:workspaceId/analytics`.

#### 🛠️ `frontend/src/components/Layout/DashboardSidebar.jsx`
Add the "Analytics" link to the sidebar menu:
```javascript
<Link
  to="/analytics"
  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
    location.pathname === '/analytics' 
      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' 
      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
  }`}
>
  <span className="material-symbols-outlined text-[20px]">bar_chart</span>
  Analytics
</Link>
```

---

## 4. Role-Based Permission Rules (Rbac)

| User Role | Workspace View | Workload Stats | Settings/Export |
| :--- | :--- | :--- | :--- |
| **Admin (Owner)** | Full access to all Workspace charts | View all developer task loads | Full access to report exports |
| **Project Manager (Admin)** | Full access to all Workspace charts | View all developer task loads | Full access to report exports |
| **Developer (Editor)** | View workspace charts | View own workload stats | Restricted |
| **Client (Viewer)** | High-level summary charts only | Hidden | Restricted |

---

## 5. Aggregation Query Example (Workload Stats)
To aggregate workload task allocations on the backend:
```javascript
Card.aggregate([
  { $match: { workspaceId: new mongoose.Types.ObjectId(workspaceId) } },
  { $unwind: "$assignedTo" },
  {
    $group: {
      _id: "$assignedTo",
      cardCount: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "user"
    }
  },
  { $unwind: "$user" },
  {
    $project: {
      username: "$user.username",
      cardCount: 1
    }
  }
]);
```
