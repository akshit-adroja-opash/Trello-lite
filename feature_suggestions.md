# Recommended UI/UX Features for Trello-lite (Next Phase)

Here is a list of 6 new feature suggestions focused on **User Experience & Interface**, specifically designed to leverage existing schemas, configurations, and installed frontend dependencies.

---

## 1. Rich Text/Markdown Editor for Descriptions & Comments
* **Problem it Solves**: Card descriptions and comments are currently rendered as plain text. Users cannot add formatted text, lists, code snippets, or clickable links to task descriptions or discussion comments.
* **How it Fits**: The frontend already has the `"react-markdown"` dependency installed in `package.json`. We can build a toggleable edit mode using a lightweight markdown previewer for card descriptions and comments in the card detail view.
* **Rough Effort**: **Easy**
* **Files to Modify/Create**:
  * `frontend/src/components/Card/CardDetail.jsx` (add edit/preview toggle for description/comments)

---

## 2. Command Palette (Ctrl+K / Cmd+K Search)
* **Problem it Solves**: Navigating between multiple boards, workspaces, and cards requires clicking through directories, sidebars, and home screens. It is slow for power users.
* **How it Fits**: A global shortcut listener (`Ctrl+K`) that opens an elegant overlay. It queries workspace and board state globally from the existing zustand stores (`useBoardStore` & `useWorkspaceStore`) and performs keyboard-navigable search matching.
* **Rough Effort**: **Medium**
* **Files to Modify/Create**:
  * Create `frontend/src/components/Layout/CommandPalette.jsx`
  * `frontend/src/components/Layout/Navbar.jsx` (render the trigger and component)

---

## 3. Card Templates for Standard Workflows
* **Problem it Solves**: Creating standard cards (e.g., Bug Reports, Feature Requests, User Stories) is repetitive. Users must manually recreate label setups, empty checklists, and descriptions every time.
* **How it Fits**: Add an `isTemplate: { type: Boolean, default: false }` field to the Card schema. Allow users to save cards as templates, and show a "Create from Template" dropdown in columns.
* **Rough Effort**: **Medium**
* **Files to Modify/Create**:
  * `backend/src/models/Card.js` (add `isTemplate` field)
  * `backend/src/controllers/card.controller.js` (duplicate card logic from template)
  * `frontend/src/components/Column/ColumnContainer.jsx` (template card selector)
  * `frontend/src/components/Card/CardDetail.jsx` (add "Save as Template" option)

---

## 4. Column Header Color & Icon Customization
* **Problem it Solves**: Lists/columns are visually identical, making it hard to scan boards to find the "Doing", "QA", or "Release" stages at a glance.
* **How it Fits**: Add a `color` field (hex or preset name) and an optional `icon` (Material Icons) to the Column schema. Render them dynamically in the column headers to make columns pop.
* **Rough Effort**: **Easy**
* **Files to Modify/Create**:
  * `backend/src/models/Column.js` (add optional `color` and `icon` properties)
  * `frontend/src/components/Column/ColumnContainer.jsx` (style column header borders and render icons)

---

## 5. Rich Checklist Items (Assignee & Deadlines)
* **Problem it Solves**: Users currently only have basic text checklist items. They cannot delegate subtasks to different developers or set subtask deadlines.
* **How it Fits**: Enhance the checklist schema array in the Card model. Instead of `[{ text, done }]`, allow items to contain `dueDate` and `assignedTo`. Render these attributes dynamically next to each checklist item inside the card modal.
* **Rough Effort**: **Medium**
* **Files to Modify/Create**:
  * `backend/src/models/Card.js` (extend checklist schema)
  * `frontend/src/components/Card/CardDetail.jsx` (render subtask datepicker/avatar assignees)

---

## 6. Keyboard-Driven Card Operations
* **Problem it Solves**: Power users want to move cards, assign themselves, edit titles, or close modals rapidly using standard shortcuts without having to click or drag.
* **How it Fits**: Implement a keyboard event listener inside `CardItem.jsx`. When a card is hovered or focused (tabbed), pressing specific keys will perform actions:
  * `Space` / `Enter`: Open Detail modal
  * `m`: Assign/unassign self
  * `t`: Edit Title inline
  * `c`: Archive Card
* **Rough Effort**: **Medium**
* **Files to Modify/Create**:
  * `frontend/src/components/Card/CardItem.jsx` (focus states and shortcut triggers)
  * `frontend/src/pages/BoardPage.jsx` (support inline focus/navigation list)
