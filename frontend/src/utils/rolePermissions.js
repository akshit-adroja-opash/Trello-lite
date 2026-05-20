/**
 * Role‑based permission helpers for the frontend.
 * All functions accept a role string ("Owner", "Admin", "Editor", "Viewer")
 * and return a boolean indicating whether the action is allowed.
 */

const ROLE_HIERARCHY = {
  Owner: 4,
  Admin: 3,
  Editor: 2,
  Viewer: 1,
};

/** Workspace level permissions */
export const canCreateWorkspace = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;
export const canDeleteWorkspace = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;
export const canManageRoles = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;
export const canInviteRemoveUsers = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;

/** Board level permissions */
export const canCreateBoard = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;
export const canDeleteBoard = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;
export const canArchiveBoard = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;
export const canEditBoardSettings = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;

/** Column level permissions — Admin (Project Manager) + Owner can manage columns */
export const canCreateColumn = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;
export const canEditColumn = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;
export const canDeleteColumn = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;
export const canReorderColumns = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;

/** Card level permissions — Editor (Developer) + Admin + Owner */
export const canCreateCard = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Editor;
export const canEditCard = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Editor;
export const canDeleteCard = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Editor;
export const canMoveCard = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Editor;
export const canAssignMembers = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;
export const canAddLabels = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Editor;
export const canChangeDueDate = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;
export const canComment = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Editor;

/** Helper to get current role from auth store */
export const getCurrentRole = () => {
  // Import lazily to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const useAuthStore = require('../store/authstore').default;
  const user = useAuthStore.getState().user;
  return user?.role || "Viewer"; // fallback to Viewer if not set
};
