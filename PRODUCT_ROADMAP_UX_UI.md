# Trello-lite MERN: Product & UX/UI Roadmap

This document outlines **6 high-impact feature recommendations** tailored specifically to the **Trello-lite MERN codebase** (MongoDB, Express, React, Node). These features focus on elevating User Experience (UX), interface responsiveness, real-time collaboration, and power-user workflows.

---

## Executive Summary & Prioritization Matrix

| # | Feature Name | Primary UX/UI Value | Effort | Core Dependencies |
|---|---|---|---|---|
| **1** | **Interactive Calendar & Timeline (Gantt) View** | Visualizing scheduling, overlaps & sprint deadlines | **Medium** | Existing `dueDate` & `estimatedHours` in `Card.js` |
| **2** | **Live Collaborative Presence** | Preventing edit conflicts & creating a live team feel | **Medium** | Existing `Socket.io` & `useAuthStore` |
| **3** | **Global Spotlight Command Palette (`Ctrl+K`)** | Rapid navigation & 10x faster action execution | **Easy / Medium** | New global modal + search controller |
| **4** | **Card Dependency Linking ("Blocked By" Chains)** | Clarity on task prerequisites & automated unblocking | **Medium** | New `dependencies` ref array in `Card.js` schema |
| **5** | **Interactive Notification Slide-Over Drawer** | Centralized triage without leaving active work | **Medium** | New `Notification.js` model & drawer component |
| **6** | **Customizable Dashboard Widgets (Drag & Drop)** | Tailoring analytics to specific user roles | **Medium / Hard** | New widget system & `User.preferences` schema |

---

## Detailed Feature Specifications

### 1. Interactive Calendar & Timeline (Gantt) View Toggle
* **What problem it solves for the user**: Currently, users can only view work as Kanban columns (`BoardPage.jsx`) or structured lists (`MyTasksPage.jsx`). When planning sprints or managing deadlines, teams struggle to visualize chronological task overlap, scheduling gaps, and delivery timelines.
* **How it fits into existing structure**: You already store `dueDate`, `createdAt`, and `estimatedHours` on the `Card` schema. We can introduce a clean view switcher header in `BoardPage.jsx` (`[ Kanban | Calendar | Timeline ]`) that maps your existing card arrays onto monthly calendar grids or horizontal timeline bars without requiring database changes.
* **Rough effort estimate**: **Medium**
* **Files to create or modify**:
  - `[NEW]` `frontend/src/components/Board/BoardCalendarView.jsx`
  - `[NEW]` `frontend/src/components/Board/BoardTimelineView.jsx`
  - `[MODIFY]` `frontend/src/pages/BoardPage.jsx`
  - `[MODIFY]` `frontend/src/components/Board/BoardHeader.jsx`

---

### 2. Live Collaborative Presence ("Who's Viewing / Editing Now")
* **What problem it solves for the user**: In active teams, two team members might open and edit the same card or checklist simultaneously without realizing the other is present, leading to overwritten descriptions, race conditions, or duplicate comments.
* **How it fits into existing structure**: You already have robust real-time infrastructure via `Socket.io` (`board.socket.js`) and user state via `useAuthStore`. By emitting simple `join_card` and `leave_card` socket events when a modal opens, we can display animated glowing avatar stacks at the top of `CardDetail.jsx` and `FocusTaskPanel.jsx` (e.g., *"Akshit is editing this card right now"*).
* **Rough effort estimate**: **Medium**
* **Files to create or modify**:
  - `[MODIFY]` `backend/src/sockets/board.socket.js`
  - `[MODIFY]` `frontend/src/components/Card/CardDetail.jsx`
  - `[MODIFY]` `frontend/src/components/Tasks/FocusTaskPanel.jsx`
  - `[MODIFY]` `frontend/src/store/socketStore.js` (or equivalent socket context)

---

### 3. Global Spotlight Command Palette (`Ctrl+K` / `Cmd+K`)
* **What problem it solves for the user**: As boards, cards, and reports accumulate, navigating via sidebar clicks and filter menus slows down power users. A global search palette allows instant jump-to-navigation and rapid task execution from anywhere in the app.
* **How it fits into existing structure**: We can implement a sleek spotlight modal registered globally in `App.jsx` or `AdminPanelLayout.jsx`. Users press `Ctrl+K` to instantly search cards across all boards, jump between pages (`/my-tasks`, `/reports`, `/analytics`), switch themes, or trigger Focus Mode on the fly.
* **Rough effort estimate**: **Easy / Medium**
* **Files to create or modify**:
  - `[NEW]` `frontend/src/components/common/CommandPalette.jsx`
  - `[NEW]` `backend/src/controllers/searchController.js` (for multi-collection regex/text search across cards and boards)
  - `[MODIFY]` `backend/src/routes/index.routes.js`
  - `[MODIFY]` `frontend/src/components/Layout/AdminPanelLayout.jsx`

---

### 4. Card Dependency Linking ("Blocked By" / "Blocking" Task Chains)
* **What problem it solves for the user**: While you currently have a `blocked` boolean toggle and `blockedReason` textarea, complex workflows require knowing *which specific task* must be completed before another can proceed.
* **How it fits into existing structure**: We can expand the `Card` MongoDB schema by adding `dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }]`. In the UI, users can link cards using a quick search dropdown. When a prerequisite card is dragged to a "Done" column, the system can automatically notify assignees and clear the `blocked` flag on dependent tasks via backend controller hooks.
* **Rough effort estimate**: **Medium**
* **Files to create or modify**:
  - `[MODIFY]` `backend/src/models/Card.js`
  - `[MODIFY]` `backend/src/controllers/cardController.js`
  - `[NEW]` `frontend/src/components/Card/CardDependencies.jsx`
  - `[MODIFY]` `frontend/src/components/Card/CardDetail.jsx`
  - `[MODIFY]` `frontend/src/components/Tasks/FocusTaskPanel.jsx`

---

### 5. Interactive Notification Slide-Over Drawer with Quick Triage
* **What problem it solves for the user**: When users get mentioned in comments, assigned to new tasks, or have their cards marked as overdue/blocked, they currently have to manually scan boards to discover updates.
* **How it fits into existing structure**: We can upgrade your top navigation bar's notification bell into an interactive slide-over drawer with categorized tabs (`All`, `Mentions`, `Blocked/Urgent`, `Unread`). Users can take direct actions inside the drawer—such as replying to a comment, marking as read, or launching directly into **Focus Mode** for that specific task.
* **Rough effort estimate**: **Medium**
* **Files to create or modify**:
  - `[NEW]` `frontend/src/components/Notifications/NotificationDrawer.jsx`
  - `[NEW]` `backend/src/models/Notification.js` (to persist notifications with unread states)
  - `[NEW]` `backend/src/controllers/notificationController.js`
  - `[MODIFY]` `frontend/src/components/Layout/AdminPanelLayout.jsx`

---

### 6. Customizable & Reorderable Dashboard Analytics Widgets
* **What problem it solves for the user**: Different roles (Admin, Project Manager, Developer, Client) care about different metrics. A developer wants to see their personal workload and urgent blockers, while a PM wants sprint velocity burndown charts and team distribution metrics.
* **How it fits into existing structure**: In `DashboardPage.jsx` and `AnalyticsPage.jsx`, we can allow users to toggle widgets on/off and reorder them via drag-and-drop. We can store their layout preferences directly inside a new `preferences.dashboardWidgets` object on your existing `User` model.
* **Rough effort estimate**: **Medium / Hard**
* **Files to create or modify**:
  - `[NEW]` `frontend/src/components/Dashboard/WidgetContainer.jsx`
  - `[NEW]` `frontend/src/components/Dashboard/widgets/WorkloadWidget.jsx`
  - `[NEW]` `frontend/src/components/Dashboard/widgets/BurndownWidget.jsx`
  - `[MODIFY]` `frontend/src/pages/DashboardPage.jsx`
  - `[MODIFY]` `backend/src/models/User.js` (add `preferences` field)

---

## Recommended Implementation Phases

### Phase 1: Quick Wins & Power-User Velocity
1. **Global Spotlight Command Palette (`Ctrl+K`)**: Delivers immediate value and makes navigation across the entire MERN app feel instantaneous.
2. **Live Collaborative Presence**: Leverages existing Socket.io infrastructure with minimal backend work to create an impressive multi-user experience.

### Phase 2: Workflow & Project Management Maturity
3. **Interactive Calendar & Timeline (Gantt) View**: Transforms the board experience for project managers planning releases and deadlines.
4. **Card Dependency Linking**: Upgrades your existing `blockedReason` into an intelligent, automated task-chain system.

### Phase 3: Personalization & Advanced Triage
5. **Interactive Notification Drawer**: Keeps users focused by centralizing alerts and providing inline triage.
6. **Customizable Dashboard Widgets**: Provides role-specific insights tailored to Developers, PMs, and Clients.
