import { prisma } from "../lib/prisma.js";
import { ROLE_NAMES, VISIBLE_ROLES } from "./permissions.js";

async function upsertRole(name: string, description: string) {
  return prisma.role.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });
}

const RETIRED_ROLE_MAP: Record<string, string> = {
  super_admin: ROLE_NAMES.ADMIN,
  organizer_admin: ROLE_NAMES.ORGANIZER,
  event_operator: ROLE_NAMES.ORGANIZER,
  checkin_staff: ROLE_NAMES.SCANNER,
};

export async function seedRbac() {
  await prisma.$executeRawUnsafe(
    `DROP TABLE IF EXISTS "role_permissions" CASCADE`,
  );
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "permissions" CASCADE`);

  const roles = await Promise.all([
    upsertRole(ROLE_NAMES.ADMIN, "Super Admin — toàn quyền hệ thống"),
    upsertRole(ROLE_NAMES.SCANNER, "Scanner — verify QR tại cổng"),
    upsertRole(ROLE_NAMES.ORGANIZER, "Organizer Admin — phạm vi BTC/sự kiện"),
    upsertRole(ROLE_NAMES.CUSTOMER, "Customer — khách mua vé"),
  ]);

  const admin = roles.find((r) => r.name === ROLE_NAMES.ADMIN);
  if (admin) {
    const admins = await prisma.user.findMany({
      where: { roleId: admin.id },
      select: { id: true },
    });
    for (const u of admins) {
      await prisma.userRoleScope.upsert({
        where: {
          userId_roleId_scopeType_scopeId: {
            userId: u.id,
            roleId: admin.id,
            scopeType: "GLOBAL",
            scopeId: 0,
          },
        },
        update: {},
        create: {
          userId: u.id,
          roleId: admin.id,
          scopeType: "GLOBAL",
          scopeId: 0,
        },
      });
    }
  }

  for (const [fromName, toName] of Object.entries(RETIRED_ROLE_MAP)) {
    const from = await prisma.role.findUnique({ where: { name: fromName } });
    const to = await prisma.role.findUnique({ where: { name: toName } });
    if (!from || !to || from.id === to.id) continue;

    const scopes = await prisma.userRoleScope.findMany({
      where: { roleId: from.id },
    });
    for (const s of scopes) {
      await prisma.userRoleScope.upsert({
        where: {
          userId_roleId_scopeType_scopeId: {
            userId: s.userId,
            roleId: to.id,
            scopeType: s.scopeType,
            scopeId: s.scopeId,
          },
        },
        update: {},
        create: {
          userId: s.userId,
          roleId: to.id,
          scopeType: s.scopeType,
          scopeId: s.scopeId,
          grantedBy: s.grantedBy,
        },
      });
    }
    await prisma.userRoleScope.deleteMany({ where: { roleId: from.id } });
    await prisma.user.updateMany({
      where: { roleId: from.id },
      data: { roleId: to.id },
    });
  }

  console.log(`✅ [RBAC] Seed ${VISIBLE_ROLES.join(" / ")}`);
}
