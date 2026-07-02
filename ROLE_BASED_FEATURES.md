# 🔐 Trello-lite: Role-Based Feature Matrix & Access Guide

Trello-lite implements an enterprise-grade **4-Tier Role-Based Access Control (RBAC)** architecture. Every feature, navigation menu, dashboard widget, and report generation capability is dynamically customized based on the authenticated user's assigned role.

---

## 📊 Quick Feature Comparison Matrix

| Feature / Capability | 👑 Admin | 👔 Project Manager (PM) | 💻 Developer | 🤝 Client |
| :--- | :---: | :---: | :---: | :---: |
| **Global User Management** (`/users`) | ✅ **Full Access** | ❌ Access Denied | ❌ Access Denied | ❌ Access Denied |
| **Create & Delete Workspaces** | ✅ **All Workspaces** | ✅ **Own Workspaces** | ❌ No | ❌ No |
| **Workspace Settings & Member Roles** | ✅ **Full Control** | ✅ **Full Control** | 👁️ View Only | 👁️ View Only |
| **Create & Delete Kanban Boards** | ✅ **Yes** | ✅ **Yes** | ❌ No | ❌ No |
| **Task Delegation & Assignment** (`/assign-task`) | ✅ **Yes** | ✅ **Yes** | ❌ No | ❌ No |
| **Kanban Card Drag & Drop Workflow** | ✅ **Yes** | ✅ **Yes** | ✅ **Yes** | 👁️ Read-Only |
| **My Tasks Dashboard** (`/my-tasks`) | ✅ **Global View** | ✅ **Assigned Tasks** | ✅ **Assigned Tasks** | 👁️ Milestone View |
| **Full Performance Audit PDF Reports** | ✅ **Yes (Un-sanitized)** | ✅ **Yes (Un-sanitized)** | ❌ Restricted | ❌ Restricted |
| **Client Progress PDF Reports** | ✅ **Yes (Sanitized)** | ✅ **Yes (Sanitized)** | ❌ Restricted | ✅ **Yes (Sanitized)** |
| **Generate & Copy Report Share Links** | ✅ **Yes** | ✅ **Yes** | ❌ Restricted | ❌ Restricted |
| **Global Analytics & KPIs** (`/analytics`) | ✅ **System-Wide** | ✅ **Workspace-Level** | ✅ **Personal Stats** | ✅ **Milestone Stats** |
| **Real-Time Presence & Collaboration** | ✅ **Yes** | ✅ **Yes** | ✅ **Yes** | ✅ **Yes** |
| **Dark / Light Theme Toggle** | ✅ **Yes** | ✅ **Yes** | ✅ **Yes** | ✅ **Yes** |

---

## 👑 1. Admin (Global System Controller)

The **Admin** role has unrestricted administrative oversight over the entire Trello-lite instance, responsible for user governance, global security, and full-stack performance monitoring.

> [!IMPORTANT]
> The **User Management Page (`/users`)** is strictly accessible only to Admin accounts. Any attempt by other roles to navigate to this endpoint triggers a security toast alert and redirects to the dashboard.

### ✨ Exclusive Admin Features:
* **Global User Governance (`/users`):**
  * Invite new users via email and username.
  * Assign and modify system roles (*Admin*, *Project Manager*, *Developer*, *Client*).
  * Permanently delete user accounts and revoke system access immediately.
* **System-Wide Dashboard Panel:**
  * View high-level widgets: *Total System Users*, *Active Workspaces*, *Global Overdue Tasks*, and *System Health Status*.
* **Unrestricted Workspace & Board Authority:**
  * Create, edit, inspect, or delete any workspace or Kanban board created by any user across the system.
  * Force-add or remove members from any private workspace.
* **Full Report Generation Engine (`/reports`):**
  * Generate and download **Full Performance Audit Reports** containing raw developer logs, granular task tracking, sprint velocity warnings, and internal notes.
  * Generate **Client Progress Reports** for external stakeholder updates.
  * Create encrypted, shareable JWT report links valid for 7 days.

---

## 👔 2. Project Manager (PM) (Workspace & Team Leader)

The **Project Manager** is the operational leader responsible for project planning, sprint execution, task delegation, and team delivery.

> [!NOTE]
> Project Managers have full autonomous control over the workspaces and boards they create or administer, but cannot alter global system users or access unrelated private workspaces.

### ✨ PM Features & Capabilities:
* **PM Dashboard Panel:**
  * Customized widgets displaying *Managed Workspaces*, *Team Velocity*, *Pending Milestone Reviews*, and *Sprint Deadlines*.
* **Workspace & Team Administration:**
  * Create new project workspaces and Kanban boards.
  * Invite Developers and Clients to join workspaces via email/username.
  * Promote or demote member permissions within their owned workspaces using the **Workspace Settings Modal**.
* **Task Delegation & Tracking (`/assign-task`):**
  * Create actionable task cards with rich descriptions, priority labels (*High*, *Medium*, *Low*), and strict due dates.
  * Assign deliverables to specific developers or multiple team members.
* **Dual Reporting Access (`/reports`):**
  * Generate **Full Performance Audit Reports** to review internal developer velocity, backlog growth warnings, and completion rates.
  * Generate **Client-Safe Progress Reports** to export polished, milestone-only summaries for client presentations.
* **Workspace Analytics (`/analytics`):**
  * Analyze task distribution charts, overdue item trends, and column completion ratios (*To Do* vs. *In Progress* vs. *Done*).

---

## 💻 3. Developer (Task & Execution Specialist)

The **Developer** role is streamlined for focus, productivity, and real-time sprint execution without administrative clutter.

> [!TIP]
> Developers benefit from the **My Tasks Page (`/my-tasks`)**, which aggregates all cards assigned to them across dozens of boards into a single, filterable view with immediate status indicators.

### ✨ Developer Features & Capabilities:
* **Developer Dashboard Panel:**
  * Streamlined view highlighting *Active Assigned Tasks*, *Upcoming Deadlines*, *Recent Activity Feed*, and *Shared Workspaces*.
* **Interactive Kanban Workflow:**
  * Drag and drop assigned task cards across columns (*To Do* ➔ *In Progress* ➔ *Review* ➔ *Done*) with real-time Socket.io synchronization.
  * Open card details to add comments, attach relevant project files, and mark sub-task checklists as complete.
* **Personalized Task Hub (`/my-tasks`):**
  * Filter tasks by due date, priority, or workspace.
  * Receive visual warnings for overdue deliverables or blocked tasks.
* **Real-Time Collaboration:**
  * Live collaborator presence indicators showing which team members are actively viewing the same Kanban board.
* **Restricted Administrative Access:**
  * Cannot delete workspaces or boards.
  * Access to the Reports Engine is restricted to prevent unauthorized export of raw financial or system audits.

---

## 🤝 4. Client (External Stakeholder & Reviewer)

The **Client** role provides a transparent, professional, and read-only window into project progress, designed to build trust while safeguarding internal development chatter.

> [!IMPORTANT]
> **Client Safety Protocol:** When Clients access the Reports Engine or view analytics, the system automatically strips out raw developer communication threads, internal bug discussions, velocity warnings, and budget-sensitive raw logs.

### ✨ Client Features & Capabilities:
* **Client Dashboard Panel:**
  * Executive overview widgets focusing on *Completed Milestones*, *Overall Project Progress (%)*, *Recent Deliverables*, and *High-Priority Status*.
* **Sanitized Progress Tracking:**
  * Read-only access to assigned workspaces and Kanban boards.
  * Ability to view completed cards in the *Review* and *Done* columns without accidentally modifying task states or altering workflows.
* **Client Progress Reports Engine (`/reports`):**
  * Exclusive capability to generate and download **Client Progress Reports**.
  * Reports generate instant PDFs formatted with executive summaries, completed milestone lists, and estimated project completion timelines.
* **Milestone Analytics (`/analytics`):**
  * Visual progress bars and charts reflecting macro-level project completion without exposing granular developer velocity metrics.

---

## 🛠️ Summary of Access Enforcement Mechanisms

1. **Frontend Navigation Guard (`Navbar.jsx` & `DashboardSidebar.jsx`):**
   * Menu items like *User Management* are conditionally rendered only when `user.role === 'admin'`.
2. **Route Protection (`UserManagementPage.jsx`):**
   * `useEffect` access control hooks redirect unauthorized users immediately if they attempt direct URL navigation.
3. **Backend Middleware Authorization (`role.middleware.js` & `reportPermission.js`):**
   * Express API endpoints enforce strict `req.user.role` validation before executing CRUD operations or generating GridFS PDF streams.
