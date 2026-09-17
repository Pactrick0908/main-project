/** Đồng bộ với backend/src/constants/permissions.ts */
export const PERMISSIONS = {
  ADMIN_ACCESS: "admin:access",
  ADMIN_WRITE: "admin:write",
  REVENUE_READ: "revenue:read",
  ROLES_GRANT: "roles:grant",
} as const;

export type PermissionCode =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  admin: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.ADMIN_WRITE,
    PERMISSIONS.REVENUE_READ,
    PERMISSIONS.ROLES_GRANT,
  ],
  manager: [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_WRITE],
  organizer: [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.REVENUE_READ],
  scanner: [PERMISSIONS.ADMIN_ACCESS],
  customer: [],
};

export function permissionsForRole(role?: string | null): PermissionCode[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] ?? [];
}

export function resolvePermissions(
  role?: string | null,
  permissions?: string[] | null,
): string[] {
  if (permissions && permissions.length > 0) return permissions;
  return permissionsForRole(role);
}

export function canAccess(
  user: { role?: string; permissions?: string[] } | null | undefined,
  permission: string,
): boolean {
  if (!user) return false;
  return resolvePermissions(user.role, user.permissions).includes(permission);
}
