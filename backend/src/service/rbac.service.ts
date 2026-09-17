import { prisma } from "../lib/prisma.js";
import {
  ASSIGNABLE_ROLES,
  ROLE_DESCRIPTIONS,
  isAssignableRole,
  permissionsForRole,
} from "../constants/permissions.js";

export class RbacService {
  /** Đảm bảo các role hệ thống tồn tại */
  static async ensureSystemRoles() {
    const specs: Array<{ name: string; description: string }> = [
      { name: "admin", description: ROLE_DESCRIPTIONS.admin },
      { name: "manager", description: ROLE_DESCRIPTIONS.manager },
      { name: "organizer", description: ROLE_DESCRIPTIONS.organizer },
      { name: "customer", description: ROLE_DESCRIPTIONS.customer },
      { name: "scanner", description: ROLE_DESCRIPTIONS.scanner },
    ];

    for (const spec of specs) {
      await prisma.role.upsert({
        where: { name: spec.name },
        create: spec,
        update: { description: spec.description },
      });
    }
  }

  static async getRoleId(roleName: string): Promise<number> {
    await this.ensureSystemRoles();
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw Object.assign(new Error(`Không tìm thấy role ${roleName}`), {
        status: 500,
      });
    }
    return role.id;
  }

  static listAssignableRoles() {
    return ASSIGNABLE_ROLES.map((name) => ({
      name,
      description: ROLE_DESCRIPTIONS[name] ?? name,
      permissions: permissionsForRole(name),
    }));
  }

  static async searchUsers(q?: string, take = 40) {
    const where = q?.trim()
      ? {
          OR: [
            { email: { contains: q.trim(), mode: "insensitive" as const } },
            { fullName: { contains: q.trim(), mode: "insensitive" as const } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      include: { role: true },
      orderBy: { id: "desc" },
      take: Math.min(Math.max(take, 1), 100),
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.fullName,
      avatar: u.avatarUrl,
      role: u.role?.name ?? "customer",
      permissions: permissionsForRole(u.role?.name),
      createdAt: u.createdAt,
    }));
  }

  static async assignRole(actorUserId: number | undefined, targetUserId: number, roleName: string) {
    if (!isAssignableRole(roleName)) {
      throw Object.assign(
        new Error(
          `Role không hợp lệ. Cho phép: ${ASSIGNABLE_ROLES.join(", ")}`,
        ),
        { status: 400 },
      );
    }

    if (actorUserId && actorUserId === targetUserId && roleName !== "admin") {
      throw Object.assign(
        new Error("Không thể tự hạ quyền tài khoản admin của chính mình"),
        { status: 400 },
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { role: true },
    });
    if (!target) {
      throw Object.assign(new Error("Không tìm thấy người dùng"), {
        status: 404,
      });
    }

    const roleId = await this.getRoleId(roleName);
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { roleId },
      include: { role: true },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.fullName,
      role: updated.role?.name ?? roleName,
      permissions: permissionsForRole(updated.role?.name),
    };
  }
}
