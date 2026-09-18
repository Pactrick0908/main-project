import type { ScopeType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  ASSIGNABLE_ROLES,
  EVENT_ONLY_ROLES,
  GLOBAL_ONLY_ROLES,
  PERMISSIONS,
  ROLE_LABELS,
  ROLE_NAMES,
  VISIBLE_ROLES,
  permissionsOf,
  roleHasPermission,
  type PermissionCode,
} from "../rbac/permissions.js"

export type ResourceScope = {
  eventId?: number;
  organizerId?: number;
};

export type AssignRoleInput = {
  userId: number;
  roleId: number;
  scopeType: ScopeType;
  scopeId?: number;
  grantedBy?: number;
};

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

export class RbacService {
  static async listAssignments(userId: number) {
    return prisma.userRoleScope.findMany({
      where: { userId },
      include: { role: true },
      orderBy: { id: "asc" },
    });
  }

  static async resolveEventOrganizerId(eventId: number): Promise<number | null> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });
    return event?.organizerId ?? null;
  }

  /**
   * User có permission trên resource?
   * GLOBAL thắng mọi scope. ORGANIZER cover mọi event của BTC đó.
   * Quyền theo role lấy từ ROLE_PERMISSIONS (hardcode), không đọc DB.
   */
  static async hasPermission(
    userId: number,
    permission: PermissionCode,
    resource: ResourceScope = {},
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) return false;

    const legacy = user.role?.name;
    if (legacy === ROLE_NAMES.ADMIN) {
      return true;
    }

    let organizerId = resource.organizerId ?? null;
    if (resource.eventId && organizerId == null) {
      organizerId = await RbacService.resolveEventOrganizerId(resource.eventId);
    }

    if (legacy === ROLE_NAMES.ORGANIZER && roleHasPermission(legacy, permission)) {
      if (resource.eventId == null && resource.organizerId == null) return true;
      if (organizerId != null && organizerId === user.id) return true;
      if (resource.organizerId != null && resource.organizerId === user.id) {
        return true;
      }
    }

    if (legacy === ROLE_NAMES.SCANNER && roleHasPermission(legacy, permission)) {
      if (resource.eventId == null) return true;
    }

    const assignments = await prisma.userRoleScope.findMany({
      where: { userId },
      include: { role: true },
    });

    for (const a of assignments) {
      if (!roleHasPermission(a.role.name, permission)) continue;

      if (a.scopeType === "GLOBAL") return true;

      if (a.scopeType === "ORGANIZER") {
        if (organizerId != null && organizerId === a.scopeId) return true;
        if (
          resource.organizerId != null &&
          resource.organizerId === a.scopeId
        ) {
          return true;
        }
      }

      if (a.scopeType === "EVENT") {
        if (resource.eventId != null && resource.eventId === a.scopeId) {
          return true;
        }
      }
    }

    return false;
  }

  static async getMyPermissions(userId: number) {
    const assignments = await RbacService.listAssignments(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    const eventIds = assignments
      .filter((a) => a.scopeType === "EVENT" && a.scopeId > 0)
      .map((a) => a.scopeId);
    const organizerIds = assignments
      .filter((a) => a.scopeType === "ORGANIZER" && a.scopeId > 0)
      .map((a) => a.scopeId);

    const [events, organizers] = await Promise.all([
      eventIds.length
        ? prisma.event.findMany({
            where: { id: { in: eventIds } },
            select: { id: true, title: true, organizerId: true },
          })
        : Promise.resolve([]),
      organizerIds.length
        ? prisma.user.findMany({
            where: { id: { in: organizerIds } },
            select: { id: true, fullName: true, email: true },
          })
        : Promise.resolve([]),
    ]);

    const eventMap = new Map(events.map((e) => [e.id, e]));
    const orgMap = new Map(organizers.map((o) => [o.id, o]));

    const roles = assignments.map((a) => ({
      assignmentId: a.id,
      roleId: a.roleId,
      role: a.role.name,
      scopeType: a.scopeType,
      scopeId: a.scopeId,
      event:
        a.scopeType === "EVENT" ? (eventMap.get(a.scopeId) ?? null) : null,
      organizer:
        a.scopeType === "ORGANIZER" ? (orgMap.get(a.scopeId) ?? null) : null,
      permissions: permissionsOf(a.role.name),
    }));

    const permissionSet = new Map<
      string,
      { code: string; scopes: Array<{ scopeType: ScopeType; scopeId: number }> }
    >();

    for (const a of assignments) {
      for (const key of permissionsOf(a.role.name)) {
        const cur = permissionSet.get(key) ?? { code: key, scopes: [] };
        cur.scopes.push({ scopeType: a.scopeType, scopeId: a.scopeId });
        permissionSet.set(key, cur);
      }
    }

    const legacyAdmin = user?.role?.name === ROLE_NAMES.ADMIN;

    return {
      userId,
      legacyRole: user?.role?.name ?? null,
      isSuperAdmin: legacyAdmin || roles.some((r) => r.scopeType === "GLOBAL"),
      roles,
      permissions: Array.from(permissionSet.values()),
    };
  }

  static async assertCanAssign(
    actorId: number,
    input: AssignRoleInput,
  ): Promise<void> {
    const scope: ResourceScope = {};
    if (input.scopeType === "EVENT" && input.scopeId != null) {
      scope.eventId = input.scopeId;
    }
    if (input.scopeType === "ORGANIZER" && input.scopeId != null) {
      scope.organizerId = input.scopeId;
    }
    const ok = await RbacService.hasPermission(
      actorId,
      PERMISSIONS.ROLE_ASSIGN,
      scope,
    );
    if (!ok) {
      throw httpError("Bạn không có quyền gán vai trò trên phạm vi này", 403);
    }

    const actorIsGlobal = await RbacService.hasPermission(
      actorId,
      PERMISSIONS.ROLE_ASSIGN,
      {},
    );
    const targetRole = await prisma.role.findUnique({
      where: { id: input.roleId },
    });
    if (targetRole?.name === ROLE_NAMES.ADMIN && !actorIsGlobal) {
      throw httpError("Chỉ Super Admin mới được gán Super Admin", 403);
    }
  }

  static async assignRole(actorId: number, raw: AssignRoleInput) {
    const user = await prisma.user.findUnique({ where: { id: raw.userId } });
    if (!user) throw httpError("Không tìm thấy user", 404);

    const role = await prisma.role.findUnique({ where: { id: raw.roleId } });
    if (!role) throw httpError("Không tìm thấy role", 404);
    if (!ASSIGNABLE_ROLES.has(role.name)) {
      throw httpError(`Role "${role.name}" không được gán qua API này`, 400);
    }

    const scopeType = raw.scopeType;
    const scopeId = scopeType === "GLOBAL" ? 0 : Number(raw.scopeId ?? 0);

    if (GLOBAL_ONLY_ROLES.has(role.name) && scopeType !== "GLOBAL") {
      throw httpError("Super Admin chỉ gán với scope GLOBAL", 400);
    }
    if (EVENT_ONLY_ROLES.has(role.name) && scopeType !== "EVENT") {
      throw httpError(`Role "${role.name}" chỉ gán với scope EVENT`, 400);
    }
    if (role.name === ROLE_NAMES.ORGANIZER && scopeType === "GLOBAL") {
      throw httpError("Organizer Admin không dùng scope GLOBAL", 400);
    }
    if (scopeType !== "GLOBAL" && (!Number.isInteger(scopeId) || scopeId < 1)) {
      throw httpError("Thiếu scopeId hợp lệ", 400);
    }

    if (scopeType === "ORGANIZER") {
      const org = await prisma.user.findUnique({ where: { id: scopeId } });
      if (!org) throw httpError("Không tìm thấy ban tổ chức (userId)", 404);
    }
    if (scopeType === "EVENT") {
      const event = await prisma.event.findUnique({
        where: { id: scopeId },
        select: { id: true, organizerId: true },
      });
      if (!event) throw httpError("Không tìm thấy sự kiện", 404);
    }

    await RbacService.assertCanAssign(actorId, {
      ...raw,
      scopeType,
      scopeId,
    });

    const assignment = await prisma.userRoleScope.upsert({
      where: {
        userId_roleId_scopeType_scopeId: {
          userId: raw.userId,
          roleId: raw.roleId,
          scopeType,
          scopeId,
        },
      },
      update: { grantedBy: actorId },
      create: {
        userId: raw.userId,
        roleId: raw.roleId,
        scopeType,
        scopeId,
        grantedBy: actorId,
      },
      include: { role: true },
    });

    if (ASSIGNABLE_ROLES.has(role.name)) {
      await prisma.user.update({
        where: { id: raw.userId },
        data: { roleId: role.id },
      });
    }

    return assignment;
  }

  static async revokeRole(actorId: number, raw: AssignRoleInput) {
    const scopeType = raw.scopeType;
    const scopeId = scopeType === "GLOBAL" ? 0 : Number(raw.scopeId ?? 0);

    await RbacService.assertCanAssign(actorId, { ...raw, scopeType, scopeId });

    const existing = await prisma.userRoleScope.findUnique({
      where: {
        userId_roleId_scopeType_scopeId: {
          userId: raw.userId,
          roleId: raw.roleId,
          scopeType,
          scopeId,
        },
      },
    });
    if (!existing) throw httpError("Không tìm thấy quyền để thu hồi", 404);

    await prisma.userRoleScope.delete({ where: { id: existing.id } });
    return { revoked: true, id: existing.id };
  }

  static async hasRoleAssignAnywhere(userId: number): Promise<boolean> {
    return RbacService.hasPermission(userId, PERMISSIONS.ROLE_ASSIGN, {});
  }

  static async getCatalog(actorId: number) {
    const canAssign = await RbacService.hasRoleAssignAnywhere(actorId);
    if (!canAssign) {
      throw httpError("Bạn không có quyền xem phân quyền", 403);
    }

    const [roles, users, events, assignments] = await Promise.all([
      prisma.role.findMany({ orderBy: { id: "asc" } }),
      prisma.user.findMany({
        include: { role: true },
        orderBy: { id: "desc" },
        take: 300,
      }),
      prisma.event.findMany({
        select: {
          id: true,
          title: true,
          organizerId: true,
          organizerName: true,
          status: true,
        },
        orderBy: { id: "desc" },
        take: 200,
      }),
      prisma.userRoleScope.findMany({
        include: {
          role: true,
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { id: "desc" },
        take: 400,
      }),
    ]);

    const eventIds = assignments
      .filter((a) => a.scopeType === "EVENT" && a.scopeId > 0)
      .map((a) => a.scopeId);
    const organizerIds = assignments
      .filter((a) => a.scopeType === "ORGANIZER" && a.scopeId > 0)
      .map((a) => a.scopeId);

    const [scopeEvents, scopeOrgs] = await Promise.all([
      eventIds.length
        ? prisma.event.findMany({
            where: { id: { in: eventIds } },
            select: { id: true, title: true },
          })
        : Promise.resolve([]),
      organizerIds.length
        ? prisma.user.findMany({
            where: { id: { in: organizerIds } },
            select: { id: true, fullName: true, email: true },
          })
        : Promise.resolve([]),
    ]);
    const eventMap = new Map(scopeEvents.map((e) => [e.id, e]));
    const orgMap = new Map(scopeOrgs.map((o) => [o.id, o]));

    const visible = new Set<string>(VISIBLE_ROLES);
    const roleOrder = [...VISIBLE_ROLES];
    const sortedRoles = roles
      .filter((r) => visible.has(r.name))
      .sort(
        (a, b) =>
          (roleOrder.indexOf(a.name as (typeof roleOrder)[number]) + 1 || 99) -
          (roleOrder.indexOf(b.name as (typeof roleOrder)[number]) + 1 || 99),
      );

    return {
      roles: sortedRoles.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.name.toUpperCase(),
        label: ROLE_LABELS[r.name] ?? r.name,
        description: r.description,
        assignable: ASSIGNABLE_ROLES.has(r.name),
        globalOnly: GLOBAL_ONLY_ROLES.has(r.name),
        eventOnly: EVENT_ONLY_ROLES.has(r.name),
      })),
      users: users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        avatarUrl: u.avatarUrl,
        legacyRole: u.role?.name ?? null,
      })),
      events,
      organizers: users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
      })),
      assignments: assignments
        .filter((a) => visible.has(a.role.name))
        .map((a) => ({
          id: a.id,
          userId: a.userId,
          roleId: a.roleId,
          role: a.role.name,
          roleLabel: ROLE_LABELS[a.role.name] ?? a.role.name,
          scopeType: a.scopeType,
          scopeId: a.scopeId,
          createdAt: a.createdAt,
          user: a.user,
          event:
            a.scopeType === "EVENT" ? (eventMap.get(a.scopeId) ?? null) : null,
          organizer:
            a.scopeType === "ORGANIZER"
              ? (orgMap.get(a.scopeId) ?? null)
              : null,
        })),
    };
  }
}
