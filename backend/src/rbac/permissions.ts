export const PERMISSIONS = {
  PLACE_MANAGE: "PLACE_MANAGE",
  ARTIST_MANAGE: "ARTIST_MANAGE",
  ORGANIZER_MANAGE: "ORGANIZER_MANAGE",
  REVENUE_PLATFORM_VIEW: "REVENUE_PLATFORM_VIEW",

  EVENT_CREATE: "EVENT_CREATE",
  EVENT_READ: "EVENT_READ",
  EVENT_UPDATE: "EVENT_UPDATE",
  EVENT_DELETE: "EVENT_DELETE",
  EVENT_REVENUE_VIEW: "EVENT_REVENUE_VIEW",
  ARTIST_ASSIGN: "ARTIST_ASSIGN",

  TICKET_LIST: "TICKET_LIST",
  TICKET_MANAGE: "TICKET_MANAGE",
  SCANNER_ISSUE: "SCANNER_ISSUE",
  TICKET_VERIFY: "TICKET_VERIFY",

  ROLE_ASSIGN: "ROLE_ASSIGN",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_NAMES = {
  ADMIN: "admin",
  SCANNER: "scanner",
  ORGANIZER: "organizer",
  CUSTOMER: "customer",
  /** alias — Super Admin = admin */
  SUPER_ADMIN: "admin",
  ORGANIZER_ADMIN: "organizer",
  ADMIN_LEGACY: "admin",
  ORGANIZER_LEGACY: "organizer",
  SCANNER_LEGACY: "scanner",
} as const;

export const VISIBLE_ROLES = [
  ROLE_NAMES.ADMIN,
  ROLE_NAMES.SCANNER,
  ROLE_NAMES.ORGANIZER,
] as const;

export const ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  [ROLE_NAMES.ADMIN]: Object.values(PERMISSIONS) as PermissionCode[],
  [ROLE_NAMES.ORGANIZER]: [
    PERMISSIONS.PLACE_MANAGE,
    PERMISSIONS.ARTIST_MANAGE,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.EVENT_UPDATE,
    PERMISSIONS.EVENT_DELETE,
    PERMISSIONS.EVENT_REVENUE_VIEW,
    PERMISSIONS.ARTIST_ASSIGN,
    PERMISSIONS.TICKET_LIST,
    PERMISSIONS.TICKET_MANAGE,
  ],
  [ROLE_NAMES.SCANNER]: [PERMISSIONS.TICKET_VERIFY],
};

export function roleHasPermission(
  roleName: string | null | undefined,
  permission: PermissionCode,
): boolean {
  if (!roleName) return false;
  if (roleName === ROLE_NAMES.ADMIN) return true;
  return (ROLE_PERMISSIONS[roleName] ?? []).includes(permission);
}

export function permissionsOf(roleName: string | null | undefined): PermissionCode[] {
  if (!roleName) return [];
  if (roleName === ROLE_NAMES.ADMIN) {
    return Object.values(PERMISSIONS) as PermissionCode[];
  }
  return ROLE_PERMISSIONS[roleName] ?? [];
}

export const ASSIGNABLE_ROLES = new Set<string>([
  ROLE_NAMES.ADMIN,
  ROLE_NAMES.SCANNER,
  ROLE_NAMES.ORGANIZER,
]);

export const GLOBAL_ONLY_ROLES = new Set<string>([ROLE_NAMES.ADMIN]);
export const EVENT_ONLY_ROLES = new Set<string>([ROLE_NAMES.SCANNER]);

export const ROLE_LABELS: Record<string, string> = {
  [ROLE_NAMES.ADMIN]: "Super Admin",
  [ROLE_NAMES.SCANNER]: "Scanner",
  [ROLE_NAMES.ORGANIZER]: "Organizer Admin",
};
