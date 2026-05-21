/**
 * Central role display name mapping.
 *
 * Backend Role  →  Display Name
 * ─────────────────────────────
 * owner         →  Admin
 * admin         →  Project Manager
 * editor        →  Developer
 * viewer        →  Client
 *
 * Board roles (Board.js members[].role):
 * Owner  →  Admin
 * Admin  →  Project Manager
 * Editor →  Developer
 * Viewer →  Client
 *
 * User system roles (User.js role):
 * admin           →  Admin
 * project_manager →  Project Manager
 * developer       →  Developer
 */

const ROLE_DISPLAY = {
  // Board roles
  Owner:  'Admin',
  Admin:  'Project Manager',
  Editor: 'Developer',
  Viewer: 'Client',

  // User system roles
  admin:           'Admin',
  project_manager: 'Project Manager',
  developer:       'Developer',
  client:          'Client',

  // Workspace member roles
  owner: 'Admin',
  editor: 'Developer',
  viewer: 'Client',
  member: 'Client',
};

/**
 * Returns the human-readable display name for any role string.
 * Falls back to the raw value if not found.
 * @param {string} role
 * @returns {string}
 */
export const getRoleDisplayName = (role) => ROLE_DISPLAY[role] ?? role;
