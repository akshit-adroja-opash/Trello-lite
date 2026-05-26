# Feature Suggestions (User Experience & Interface)

## 1) Notification Inbox Search & Filters
**Problem it solves:** Users can quickly find older notifications (e.g., “card moved”, “invited”, “report ready”) instead of scrolling a long list.

**How it fits existing structure:**
- Backend already returns a user’s notifications sorted by `createdAt`.
- Current UI (`NotificationDropdown`) renders messages only; adding client-side search/filter is a natural extension.

**Effort estimate:** Easy

**Files to create or modify:**
- **Modify:** `frontend/src/components/Notifications/NotificationDropdown.jsx` (add search input + filter chips)
- **Modify:** `frontend/src/store/notificationStore.js` (optional: store/search state or precomputed categories)
- **Modify:** `frontend/src/api/notification.api.js` (optional if you decide to add server-side search later)

---

## 2) Notification “Snooze” for Clutter Control
**Problem it solves:** Users can temporarily hide noisy notifications (e.g., repetitive activity) without losing them permanently.

**How it fits existing structure:**
- Notifications already have `isRead` and are recipient-specific.
- You can introduce a lightweight “snoozedUntil” concept; UI can hide snoozed notifications until the time elapses.

**Effort estimate:** Medium

**Files to create or modify:**
- **Modify:** `backend/src/models/Notification.js` (add `snoozedUntil` or equivalent)
- **Modify:** `backend/src/controllers/notification.controller.js` (exclude snoozed notifications from `getNotifications`)
- **Modify/Create:** `backend/src/routes/notification.routes.js` + `backend/src/controllers/notification.controller.js` (new endpoint: `PATCH /snooze`)
- **Modify:** `frontend/src/components/Notifications/NotificationDropdown.jsx` (add “Snooze 1h / 1d” UI)
- **Modify:** `frontend/src/api/notification.api.js` (snooze call)
- **Modify:** `frontend/src/store/notificationStore.js` (update local list/unread count logic)

---

## 3) Activity Feed “Live Mode” + Smart Grouping
**Problem it solves:** The activity feed can become hard to scan; users benefit from grouping repeated events and optionally pausing live updates.

**How it fits existing structure:**
- `ActivitySidebar.jsx` fetches board activities via `getBoardActivities(boardId)` and renders a simple list.
- Your board page already supports presence and socket events; this feature can be implemented mostly in UI with optional server support for grouping.

**Effort estimate:** Medium

**Files to create or modify:**
- **Modify:** `frontend/src/components/Board/ActivitySidebar.jsx` (add “Live: On/Off” toggle + grouping by time window / actor / action)
- **Modify:** `frontend/src/api/activity.api.js` (optional: add query params like `group=true`)
- **Modify/Create (optional):** backend activity controller/route if you want server-side grouping

---

## 4) Card Detail Inline Drawer (Faster Workflow)
**Problem it solves:** Users currently interact via board columns and modals/components. Opening a dedicated inline “drawer” for card details (title, description, due date, assignees, labels, attachments) reduces context switching.

**How it fits existing structure:**
- You already have `CardDetail` and `CardItem` components.
- `BoardPage.jsx` tracks `activeCard`; this is the perfect trigger for an overlay/drawer.

**Effort estimate:** Easy

**Files to create or modify:**
- **Modify:** `frontend/src/pages/BoardPage.jsx` (open drawer when clicking card; handle close)
- **Modify:** `frontend/src/components/Card/CardItem.jsx` (wire click handler)
- **Modify/Create:** `frontend/src/components/Card/CardDetail.jsx` (ensure it works as a drawer: responsive layout, quick actions)
- **Optional:** `frontend/src/components/Card/CardDetailDrawer.jsx` (if you want separation)

---

## 5) Saved Filter Presets per Board (UX Consistency)
**Problem it solves:** Users repeatedly apply the same label/assignee/due-date/sort filters. Presets reduce repetitive configuration.

**How it fits existing structure:**
- `BoardPage.jsx` already has rich filter state: `selectedLabels`, `selectedAssignees`, `dueDateFilter`, `sortBy`.
- Persisting presets matches your existing board customization patterns (board settings modal already exists).

**Effort estimate:** Hard

**Files to create or modify:**
- **Modify:** `frontend/src/pages/BoardPage.jsx` (preset UI: save/apply/rename)
- **Modify/Create:** `frontend/src/components/Board/FilterSortPanel.jsx` (if you centralize filter UI)
- **Modify/Create:** backend models/endpoints to persist presets per user+board:
  - **Create:** `backend/src/models/FilterPreset.js`
  - **Create:** controller/routes for CRUD
- **Modify:** `frontend/src/api/*` (add `filterPreset.api.js` or extend board api)
- **Modify:** `frontend/src/store/*` (optional if you want global caching)

---

## 6) Calendar View Enhancements: “Click-through” Day Summary
**Problem it solves:** Calendar view (in `BoardPage.jsx` using `BoardCalendarView`) is likely visual-first. Users often need a quick breakdown per day: how many due today/overdue, and top cards.

**How it fits existing structure:**
- `BoardPage.jsx` already switches to `viewMode === 'calendar'` and passes `filteredCards` into `BoardCalendarView`.
- You can implement a hover/click popover using the already-filtered dataset.

**Effort estimate:** Medium

**Files to create or modify:**
- **Modify:** `frontend/src/components/Board/BoardCalendarView.jsx` (day popover with counts + card list preview)
- **Modify:** `frontend/src/pages/BoardPage.jsx` (optional: open Card Detail Drawer when clicking a card from the calendar)
- **Optional:** small styling updates in `frontend/src/App.css` or `frontend/src/index.css`

---

## Notes on Non-redundancy
These are designed to be additive based on what’s visible in your code excerpts:
- Notifications exist, but there’s no search/filter/snooze UI in the dropdown.
- Activity feed exists, but no “Live mode”/grouping is visible.
- Card details exist as components, but not an inline drawer triggered from `activeCard` in `BoardPage.jsx`.
- Filter state exists in `BoardPage.jsx`, but presets/persistence are not visible.
- Calendar view exists, but day summaries/popovers are not visible.

