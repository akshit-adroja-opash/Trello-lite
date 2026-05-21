# Trello Lite — Next Improvements (Progress Tracker)

## Planned Steps

1. Repo analysis (done): identify relevant files for board access control, drag-end closure bug, and role restriction.
2. Implement **High Priority** fixes:
   - 2.1 Ensure backend board access control in `getSingleBoard` (confirm existing behavior).
   - 2.2 Fix `handleDragEnd` dependency array in `frontend/src/pages/BoardPage.jsx`.
   - 2.3 Restrict `RegisterPage.jsx` role options (confirm existing behavior).
3. Implement **Medium Priority** fixes:
   - 3.1 Wire notifications creation + socket emit where required.
   - 3.2 Add socket-driven activity feed updates to `ActivitySidebar`.
   - 3.3 Ensure `/cards/my-tasks` backend route + controller exist, and frontend page matches.
   - 3.4 Ensure card comments end-to-end (model, controller, routes, UI) works.
4. Implement **Low Priority** UX improvements (if time):
   - 4.1 Add board member management UI.
   - 4.2 Add profile update page + backend route.
   - 4.3 Add overdue summary badges on dashboard.

## Status

- [x] Step 1: Repo analysis
- [ ] Step 2: High Priority fixes
- [ ] Step 3: Medium Priority fixes
- [ ] Step 4: Low Priority UX improvements

