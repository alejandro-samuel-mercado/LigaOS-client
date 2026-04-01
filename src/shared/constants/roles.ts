/**
 * Role constants and permission definitions.
 * Maps each role to its allowed actions across the system.
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  PRESIDENT: 'PRESIDENT',
  COACH: 'COACH',
  PLAYER: 'PLAYER',
  REFEREE: 'REFEREE',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

/**
 * Hierarchical permission levels for authorization checks.
 * Higher values indicate broader access.
 */
export const ROLE_HIERARCHY: Record<RoleName, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  PRESIDENT: 60,
  COACH: 40,
  PLAYER: 20,
  REFEREE: 30,
};
