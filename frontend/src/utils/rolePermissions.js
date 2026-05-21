/**
 * Role-based permission helpers for the frontend.
 *
 * Board Role  →  Display Name
 * ───────────────────────────
 * Owner       →  Admin
 * Admin       →  Project Manager
 * Editor      →  Developer
 * Viewer      →  Client
 */

const ROLE_HIERARCHY = {
  Owner:  4,  // Admin
  Admin:  3,  // Project Manager
  Editor: 2,  // Developer
  Viewer: 1,  // Client
};

/** Workspace level — only Admin (Owner) */
export const canCreateWorkspace    = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;
export const canDeleteWorkspace    = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;
export const canManageRoles        = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;
export const canInviteRemoveUsers  = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;

/** Board level — only Admin (Owner) */
export const canCreateBoard        = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;
export const canDeleteBoard        = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;
export const canArchiveBoard       = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;
export const canEditBoardSettings  = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.Owner;

/** Column level — Admin (Owner) + Project Manager (Admin) */
export const canCreateColumn   = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;
export const canEditColumn     = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;
export const canDeleteColumn   = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;
export const canReorderColumns = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;

/** Card level — Admin (Owner) + Project Manager (Admin) only */
export const canCreateCard    = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;
export const canEditCard      = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;
export const canDeleteCard    = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;
export const canAssignMembers = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;
export const canAddLabels     = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;
export const canChangeDueDate = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Admin;

/** Move card — Developer (Editor) can only move their own assigned cards */
export const canMoveCard = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.Editor;

/** Helper to get current role from auth store */
export const getCurrentRole = () => {
  const useAuthStore = require('../store/authstore').default;
  const user = useAuthStore.getState().user;
  return user?.role || 'Viewer';
};
