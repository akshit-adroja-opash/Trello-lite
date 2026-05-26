# Trello-Lite: Next-Generation UX/UI Feature Roadmap

This document proposes 6 new User Experience and Interface features designed to enhance usability, personalization, and productivity within the current Trello-lite codebase.

---

## 3. Real-Time Comment Tagging and Mentions (`@username`)
* **Problem Solved**: Users currently have to actively check card details to see updates. Mentions allow team members to tag each other directly in comments, generating instant context-aware notifications.
* **Code Integration**:
  - Parse the comment text on comment submission for `@username` patterns.
  - Hook into the existing socket notification backend framework to send notification payloads to mentioned users in real-time.
* **Effort**: **Medium**
* **Files to Create or Modify**:
  - `backend/src/controllers/card.controller.js`
  - `frontend/src/components/Card/CardDetail.jsx`

---

## 4. Multi-Select & Bulk Card Actions
* **Problem Solved**: Managing multiple cards (moving them to review, changing assignees, deleting, or labeling) requires opening them one by one. This becomes highly repetitive on active boards.
* **Code Integration**:
  - Add a "Bulk Actions" mode switch in the board header.
  - Introduce checkboxes to `CardItem.jsx` cards and manage a selected list state in `BoardPage.jsx`.
  - Render a floating action bar at the bottom of the screen to trigger batch API actions.
* **Effort**: **Hard**
* **Files to Create or Modify**:
  - `frontend/src/pages/BoardPage.jsx`
  - `frontend/src/components/Card/CardItem.jsx`
  - `frontend/src/store/boardStore.js`
  - `frontend/src/components/Board/BulkActionBar.jsx` *(New)*

---

## 5. Filter Presets (Save Custom Views)
* **Problem Solved**: Users often use the same filters repeatedly (e.g. "My Overdue Tasks" or "Urgent Client Cards"). Having to manually set up filters every visit is inefficient.
* **Code Integration**:
  - Add a simple save option to the current board filters sidebar.
  - Save the filtering configuration state (labels, due dates, assignees) directly to the user's `localStorage` or profile model.
* **Effort**: **Easy**
* **Files to Create or Modify**:
  - `frontend/src/pages/BoardPage.jsx`

---

## 6. Visual Column Identifiers (Header Colors & Icons)
* **Problem Solved**: Standardized grey columns can look indistinguishable. Giving columns custom colors (e.g. green for "Done", orange for "In Progress") or icons allows for faster visual processing.
* **Code Integration**:
  - Add optional `color` and `icon` properties to the `Column` schema.
  - Modify the column configuration popover to let users choose a color code or standard indicator.
* **Effort**: **Easy**
* **Files to Create or Modify**:
  - `backend/src/models/Column.js`
  - `frontend/src/components/Column/ColumnItem.jsx`
  - `frontend/src/components/Column/ColumnSettingsModal.jsx` *(New or existing settings)*
