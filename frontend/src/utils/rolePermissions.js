import useAuthStore from '../store/authstore';

/**
 * Role-based permission helpers for the frontend.
 *
 * Board Role       →  Display Name      →  Level
 * ─────────────────────────────────────────────
 * admin            →  Admin             →  4
 * project_manager  →  Project Manager   →  3
 * developer        →  Developer         →  2
 * client           →  Client            →  1
 */

const ROLE_HIERARCHY = {
  admin:           4,  // Admin
  project_manager: 3,  // Project Manager
  developer:       2,  // Developer
  client:          1,  // Client
};

/** Workspace / Board settings — only Admin */
export const canCreateWorkspace    = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.admin;
export const canDeleteWorkspace    = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.admin;
export const canManageRoles        = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.admin;
export const canInviteRemoveUsers  = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.admin;

/** Board level — only Admin */
export const canCreateBoard        = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.admin;
export const canDeleteBoard        = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.admin;
export const canArchiveBoard       = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.admin;
export const canEditBoardSettings  = (role) => ROLE_HIERARCHY[role] === ROLE_HIERARCHY.admin;

/** Column level — Admin + Project Manager */
export const canCreateColumn       = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.project_manager;
export const canEditColumn         = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.project_manager;
export const canDeleteColumn       = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.project_manager;
export const canReorderColumns     = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.project_manager;

/** Card level — Admin + Project Manager */
export const canCreateCard         = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.project_manager;
export const canEditCard           = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.project_manager;
export const canDeleteCard         = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.project_manager;
export const canAssignMembers      = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.project_manager;
export const canAddLabels          = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.project_manager;
export const canChangeDueDate      = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.project_manager;

/** Move card — Developer and above */
export const canMoveCard           = (role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.developer;

/** Helper to get current role from auth store */
export const getCurrentRole = () => {
  const user = useAuthStore.getState().user;
  return user?.role || 'client';
};

