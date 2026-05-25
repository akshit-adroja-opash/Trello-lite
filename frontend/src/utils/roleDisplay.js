/**
 * Unified role display name mapping.
 *
 * Board roles now match workspace/system roles exactly:
 *   admin           →  Admin
 *   project_manager →  Project Manager
 *   developer       →  Developer
 *   client          →  Client
 */

const ROLE_DISPLAY = {
  admin:           'Admin',
  project_manager: 'Project Manager',
  developer:       'Developer',
  client:          'Client',
};

/**
 * Returns the human-readable display name for any role string.
 * Falls back to the raw value if not found.
 * @param {string} role
 * @returns {string}
 */
export const getRoleDisplayName = (role) => {
  if (!role) return '';
  return ROLE_DISPLAY[role] || role;
};

// Named exports for convenience
export const BOARD_ROLE_DISPLAY = ROLE_DISPLAY;
export const SYSTEM_ROLE_DISPLAY = ROLE_DISPLAY;
export const WORKSPACE_ROLE_DISPLAY = ROLE_DISPLAY;

