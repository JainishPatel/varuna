/**
 * Varuna RBAC Configuration
 * Defines roles, permissions, and default seeded users.
 */

export const ROLES = {
  admin: {
    key: 'admin',
    label: 'Administrator',
    shortLabel: 'Admin',
    color: '#dc2626',       // Red/Rose
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    description: 'Full administrative access — manage users, run simulations, export reports',
  },
  analyst: {
    key: 'analyst',
    label: 'Data Analyst',
    shortLabel: 'Analyst',
    color: '#2563eb',       // Blue
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    description: 'Run hydro-economic simulations, view analytics, export data',
  },
  viewer: {
    key: 'viewer',
    label: 'Field Officer',
    shortLabel: 'Viewer',
    color: '#059669',       // Emerald
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    description: 'Read-only access to maps, district rankings, and data inventory',
  },
};

export const PERMISSIONS = {
  view_dashboard:    { admin: true, analyst: true, viewer: true },
  run_simulation:    { admin: true, analyst: true, viewer: false },
  run_optimizer:     { admin: true, analyst: true, viewer: false },
  export_report:     { admin: true, analyst: true, viewer: false },
  view_map:          { admin: true, analyst: true, viewer: true },
  view_analytics:    { admin: true, analyst: true, viewer: true },
  view_rankings:     { admin: true, analyst: true, viewer: true },
  view_methodology:  { admin: true, analyst: true, viewer: true },
  view_report:       { admin: true, analyst: true, viewer: true },
  view_data_explorer:{ admin: true, analyst: true, viewer: true },
  manage_users:      { admin: true, analyst: false, viewer: false },
  download_csv:      { admin: true, analyst: true, viewer: false },
};

/**
 * Check if a role has a given permission.
 */
export function checkPermission(role, permission) {
  const perm = PERMISSIONS[permission];
  if (!perm) return false;
  return !!perm[role];
}

/**
 * Simple SHA-256 hash for client-side password storage.
 * Demo/portfolio grade.
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_varuna_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Default seeded users.
 */
export const DEFAULT_USERS = [
  { id: '1', username: 'admin',   role: 'admin',   displayName: 'Admin User',    createdAt: '2026-01-01T00:00:00Z' },
  { id: '2', username: 'analyst', role: 'analyst',  displayName: 'Data Analyst',  createdAt: '2026-01-01T00:00:00Z' },
  { id: '3', username: 'viewer',  role: 'viewer',   displayName: 'Field Officer', createdAt: '2026-01-01T00:00:00Z' },
];

export const DEFAULT_PASSWORD_MAP = {
  admin: 'admin123',
  analyst: 'analyst123',
  viewer: 'viewer123',
};
