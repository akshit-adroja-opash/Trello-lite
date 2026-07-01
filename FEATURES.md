# Trello-lite: Core Feature Summary

**Trello-lite** is a responsive, full-stack project management and collaboration platform inspired by Trello. It features enterprise Role-Based Access Control (RBAC), automated PDF reporting, real-time presence tracking, and a mobile-first dark/light UI.

---

## 🌟 Key Features

### 🔐 1. 4-Tier Role-Based Access Control (RBAC)
* **Admin:** Global system oversight, user management, workspace deletion, and full internal performance audits.
* **Project Manager (PM):** Workspace & board creation, team invitations, task delegation, and reporting access.
* **Developer:** Kanban board execution, task status updates, personal task view, and real-time collaboration.
* **Client:** Read-only sanitized progress view, high-level milestone tracking, and Client-Safe PDF downloads.

---

### 🏢 2. Workspaces & Kanban Boards
* **Multi-Member Workspaces:** Organize projects by client or department with custom descriptions and team invitations.
* **Interactive Kanban Workflow:** Multi-column boards (*To Do*, *In Progress*, *Review*, *Done*) with drag-and-drop task cards.
* **Mobile-Optimized Cards:** Responsive workspace action buttons and corner-aligned management tools.

---

### 📋 3. Task Management & Collaboration
* **Task Delegation Engine (`AssignTaskPage`):** Assign deliverables with due dates, priorities, and descriptions.
* **My Tasks Dashboard (`MyTasksPage`):** Centralized aggregator filtering all tasks assigned to the logged-in user across all workspaces.
* **Overdue Alerts & Presence:** Real-time visual badges for overdue/blocked items and live collaborator tracking (`usePresence`).

---

### 📊 4. Automated PDF Reports Engine (`ReportsPage`)
* **Full Performance Audit (Admin / PM Only):** Un-sanitized reports featuring developer activity logs, milestone velocity, and internal metrics.
* **Client-Safe Progress Report:** Sanitized summaries focusing on completed milestones while stripping internal dev chatter and budgets.
* **Secure Sharing & Archive:** Generate shareable encrypted links and re-download reports from a searchable archive table.

---

### 📈 5. Global Analytics & Metrics (`AnalyticsPage`)
* **Role-Specific KPIs:** Instant widgets for *Total Users*, *Active Workspaces*, *Overdue Items*, and *Pending Client Reviews*.
* **Productivity Visuals:** Charts tracking team output, task completion rates, and workspace distribution.

---

### 🎨 6. Modern, Responsive UI/UX
* **Mobile-First Layout:** Fluid scaling across phone, tablet, and desktop viewports (`sm:`, `md:`, `lg:` breakpoints).
* **Consistent Vertical Alignment:** Standardized top-aligned layouts across admin panels to prevent visual jumping during navigation.
* **Theme & Alerts:** Persistent Dark/Light mode toggle (`ThemeToggle`) and a real-time notification bell system.

---

## 🛠️ Tech Stack
* **Frontend:** React (Vite), Tailwind CSS, Zustand, React Router DOM, React Hot Toast, Lucide / Material Symbols.
* **Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT Authentication, PDF generation service.
