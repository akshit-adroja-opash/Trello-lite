# Recommended UI/UX Features for Trello-lite

Here is a list of 7 new feature suggestions focused on **User Experience & Interface**, specifically designed to leverage existing backend schemas, socket infrastructures, and components.

---

## 1. Card Filter & Search Header
* **Problem it Solves**: As boards grow, finding a specific card or viewing only task cards assigned to a specific person/category becomes difficult.
* **How it Fits**: In `BoardPage.jsx`, cards are retrieved per column. We can filter this list on the client side using a state query matching card titles, labels, or assignees before passing them to the columns.
* **Rough Effort**: **Easy**
* **Files to Modify**:
  * `frontend/src/pages/BoardPage.jsx`

---

## 2. Starred Boards Section
* **Problem it Solves**: Quick navigation for users who manage many workspaces and boards.
* **How it Fits**: The backend `Board` schema already includes an `isStarred: { type: Boolean, default: false }` field. We can implement a starring toggle on the Board view, and display a "Starred" section on the dashboard and sidebar.
* **Rough Effort**: **Easy**
* **Files to Modify/Create**:
  * `backend/src/controllers/board.controller.js` (add patch route to toggle star)
  * `frontend/src/api/board.api.js` (export star API call)
  * `frontend/src/pages/DashboardPage.jsx` (render Starred section)
  * `frontend/src/components/Layout/DashboardSidebar.jsx` (render Starred list)

---

## 3. Card Checklist Progress Bars
* **Problem it Solves**: Users currently have to click and open a card detail modal to see if it has checklist items and if they are completed.
* **How it Fits**: The `Card` schema contains `checklist: [{ text, done }]`. We can calculate completed items directly inside the card preview markup and render a small indicator (e.g. `2/5 checklist items`) along with a CSS progress bar.
* **Rough Effort**: **Easy**
* **Files to Modify**:
  * `frontend/src/pages/BoardPage.jsx` (update the Card card-render block)

---

## 4. Real-time Notifications Drawer
* **Problem it Solves**: Ambient, real-time alert visibility. Users currently get system logs but no dropdown panel to check their incoming notifications.
* **How it Fits**: The backend already has a `Notification` model, an Express controller for notifications, and socket handlers. We can add a notification bell in the main `Navbar` that displays a dropdown listing unread alerts.
* **Rough Effort**: **Medium**
* **Files to Modify/Create**:
  * `frontend/src/components/Layout/Navbar.jsx` (render bell icon and dropdown state)
  * `frontend/src/api/notification.api.js` (fetch and mark notifications read)
  * Create `frontend/src/components/Layout/NotificationDrawer.jsx`

---

## 5. Board Activity History Drawer
* **Problem it Solves**: Team transparency. Workspace members cannot easily see the revision/update log for a board (e.g. who moved a card, when a comment was added).
* **How it Fits**: The backend already logs board activities via `logActivity()` to the `Activity` model. We can fetch activities for the board and render them in a slide-out drawer on the `BoardPage`.
* **Rough Effort**: **Medium**
* **Files to Modify/Create**:
  * `frontend/src/pages/BoardPage.jsx` (render Toggle Activity button)
  * Create `frontend/src/components/Board/BoardActivityDrawer.jsx`

---

## 6. Card Deadline Calendar View
* **Problem it Solves**: Users cannot see their upcoming deadlines in a chronological, visual timeline or calendar grid. They have to scan cards or check the "My Tasks" list.
* **How it Fits**: Create a view option toggle (Kanban Board vs. Calendar) in `BoardPage.jsx`. Group cards by `dueDate` into a standard grid representing days of the current month.
* **Rough Effort**: **Medium**
* **Files to Modify/Create**:
  * Create `frontend/src/pages/CalendarView.jsx` (or embed a calendar component)
  * `frontend/src/pages/BoardPage.jsx` (add view switch toggle)

---

## 7. Custom Accent & Theme Panel
* **Problem it Solves**: Visual fatigue. Users want to customize their canvas beyond a simple light/dark toggle, adjusting default board colors, accent colors, and custom glassmorphic opacity.
* **How it Fits**: Expand the `ThemeToggle` or create a settings section on the profile page that updates CSS variables (like `--color-primary`) on the root HTML node and saves user theme options.
* **Rough Effort**: **Medium**
* **Files to Modify**:
  * `frontend/src/pages/ProfilePage.jsx` (add customizable theme options)
  * `frontend/src/index.css` (bind variables to custom variables)
  * `frontend/src/components/ThemeToggle.jsx`
