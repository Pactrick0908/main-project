/** Mã quyền dùng chung backend + logic JWT */
export const PERMISSIONS = {
  ADMIN_ACCESS: "admin:access",
  ADMIN_WRITE: "admin:write",
  REVENUE_READ: "revenue:read",
  ROLES_GRANT: "roles:grant",
} as const;

export type PermissionCode =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ASSIGNABLE_ROLES = [
  "admin",
  "manager",
  "organizer",
  "customer",
  "scanner",
] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

/** Ma trận quyền theo role */
export const ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
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

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Toàn quyền + phân quyền + xem doanh thu",
  manager: "Vận hành đầy đủ, không xem doanh thu",
  organizer: "Chỉ xem doanh thu",
  scanner: "Soát vé QR",
  customer: "Khách mua vé",
};

export function permissionsForRole(role?: string | null): PermissionCode[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(
  role: string | undefined | null,
  permission: PermissionCode | string,
): boolean {
  return permissionsForRole(role).includes(permission as PermissionCode);
}

export function isAssignableRole(role: string): role is AssignableRole {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(role);
}
