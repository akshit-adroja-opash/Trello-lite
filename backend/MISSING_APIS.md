# Missing Backend APIs and Gaps

This file summarizes the missing backend APIs and feature gaps in `backend/` relative to the Trello-lite assignment requirements.

## Existing API coverage

- `POST /api/v1/auth/register` - register user
- `POST /api/v1/auth/login` - login user
- `GET /api/v1/auth/me` - get current user
- `POST /api/v1/workspaces` - create workspace
- `GET /api/v1/workspaces` - list workspaces for user
- `POST /api/v1/boards` - create board
- `GET /api/v1/boards/workspace/:workspaceId` - list boards by workspace
- `POST /api/v1/columns` - create column
- `GET /api/v1/columns/board/:boardId` - list columns by board
- `POST /api/v1/cards` - create card
- `GET /api/v1/cards/column/:columnId` - list cards by column
- `PATCH /api/v1/cards/:cardId` - update card

## Missing APIs / routes

### Workspace APIs
- Invite workspace members by email
- Add workspace member management endpoints
  - `POST /api/v1/workspaces/:workspaceId/invite`
  - `GET /api/v1/workspaces/:workspaceId/members`
  - `PATCH /api/v1/workspaces/:workspaceId/members/:memberId` (role updates)
  - `DELETE /api/v1/workspaces/:workspaceId/members/:memberId`
- Update workspace details
  - `PATCH /api/v1/workspaces/:workspaceId`
- Delete workspace
  - `DELETE /api/v1/workspaces/:workspaceId`

### Board APIs
- Get single board details
  - `GET /api/v1/boards/:boardId`
- Update board metadata
  - `PATCH /api/v1/boards/:boardId`
- Delete board
  - `DELETE /api/v1/boards/:boardId`
- Board permission API / role enforcement endpoints
  - `GET /api/v1/boards/:boardId/members`
  - `PATCH /api/v1/boards/:boardId/members/:memberId`

### Column APIs
- Update column
  - `PATCH /api/v1/columns/:columnId`
- Delete column
  - `DELETE /api/v1/columns/:columnId`
- Reorder columns when board layout changes
  - `PATCH /api/v1/boards/:boardId/columns/reorder`

### Card APIs
- Get single card details
  - `GET /api/v1/cards/:cardId`
- Delete card
  - `DELETE /api/v1/cards/:cardId`
- Card detail view / full card fields should be supported on create/update
  - description (markdown)
  - labels
  - due date
  - assignees
  - checklist
- Card move API for server validation and persisted order change
  - `PATCH /api/v1/cards/:cardId/move`

### Activity APIs
- Activity log endpoints are missing entirely
  - `GET /api/v1/cards/:cardId/activity`
  - `POST /api/v1/cards/:cardId/activity`
- Activity schema exists but no controller or route

### Permissions and auth enforcement
- Role-based permission enforcement is not implemented
  - `src/middleware/role.middleware.js` is placeholder only
- Viewer/Editor/Owner authorization is not enforced in API routes
- Workspace invite and role assignment logic is missing

### Real-time / socket gaps
- Socket events exist for board join/leave, card move, presence update
- Missing server-side support for:
  - board room authorization
  - persisting moves to DB on socket events
  - conflict resolution using `updatedAt`/version fields
  - cursor presence data and active-user list

## Additional functional gaps
- No endpoints for search/filter by label / assignee / due date
- No endpoint for card checklist management
- No workspace/board member invite by email flow
- No protected routes returning 401/403 for wrong role or unauthorized access

## Summary

The current backend implements basic create/read flows for workspaces, boards, columns, and cards, but it still needs:

1. member invitation and role management APIs
2. board/column/card update/delete/detail APIs
3. activity log APIs
4. API-level permission enforcement
5. stronger real-time persistence/conflict handling
6. search/filter/checklist API support
