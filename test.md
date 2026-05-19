# Testing Trello-lite

This file explains how to test the Trello-lite application. Since there are currently no automated tests (like Jest or Cypress) configured in the project, testing is primarily manual, supplemented by linting.

## 1. Manual Testing (End-to-End)

To test the application manually, you need to run both the backend and the frontend servers.

### Prerequisites

Make sure you have installed dependencies in both directories:
```bash
# In the backend directory
npm install

# In the frontend directory
npm install
```

### Running the Application

1. **Start the Backend Server**:
   Navigate to the `backend` directory and run:
   ```bash
   npm run dev
   ```
   This will start the backend server with `nodemon` for auto-reloading.

2. **Start the Frontend Server**:
   Navigate to the `frontend` directory and run:
   ```bash
   npm run dev
   ```
   This will start the Vite development server. Open the URL provided in the terminal (usually `http://localhost:5173`).

### Test Cases

#### Authentication
- [ ] **Register**: Try creating a new account. Verify that you are redirected to the login page or logged in directly.
- [ ] **Login**: Log in with the created credentials. Verify you are redirected to the dashboard.
- [ ] **Logout**: Click the logout button and verify you cannot access protected routes like the dashboard.

#### Workspaces
- [ ] **Create Workspace**: Click "Create Workspace", fill in the details, and verify it appears in the list.
- [ ] **Delete Workspace**: Click the "Delete" button on a workspace, confirm the action, and verify it disappears.

#### Boards
- [ ] **Create Board**: Inside a workspace, click "Add Board" or "Create New Board", choose a color, and verify it appears.
- [ ] **View Board**: Click on a board to enter the board view.

## 2. Static Analysis (Linting)

You can run the linter in the frontend to check for code style and potential errors.

In the `frontend` directory, run:
```bash
npm run lint
```

## 3. Recommended Future Testing Setup

To implement automated testing, consider adding the following:

### Unit & Integration Tests (Backend)
- **Framework**: [Supertest](https://www.npmjs.com/package/supertest) combined with [Jest](https://jestjs.io/) or [Vitest](https://vitest.dev/).
- **Purpose**: Test API endpoints without running the full frontend.

### Unit & Component Tests (Frontend)
- **Framework**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) with Vitest.
- **Purpose**: Test individual React components and custom hooks.

### End-to-End (E2E) Tests
- **Framework**: [Cypress](https://www.cypress.io/) or [Playwright](https://playwright.dev/).
- **Purpose**: Automate the manual test cases described above by simulating user interactions in a real browser.
