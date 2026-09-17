import { prisma } from "../lib/prisma.js";

export type CreatePlaceInput = {
  name: string;
  address?: string;
  city?: string;
  zones?: Array<{ name: string; hasSeats?: boolean }>;
};

export type UpdatePlaceInput = {
  name?: string;
  address?: string;
  city?: string;
  zones?: Array<{ id?: number; name: string; hasSeats?: boolean }>;
};

export type CreateOrganizerInput = {
  /** Tên nhà cung cấp / ban tổ chức */
  fullName: string;
  email: string;
  /** Logo / ảnh nhà cung cấp */
  avatarUrl?: string;
  walletAddress?: string;
};

export type UpdateOrganizerInput = {
  fullName?: string;
  email?: string;
  avatarUrl?: string;
};

async function ensureRole(name: string, description: string) {
  let role = await prisma.role.findUnique({ where: { name } });
  if (!role) {
    role = await prisma.role.create({
      data: { name, description },
    });
  }
  return role;
}

export class CatalogService {
  static async listPlaces() {
    return prisma.place.findMany({
      include: {
        zones: {
          include: { _count: { select: { seats: true } } },
        },
        _count: { select: { events: true } },
      },
      orderBy: { id: "desc" },
    });
  }

  static async createPlace(input: CreatePlaceInput) {
    const name = input.name?.trim();
    if (!name) {
      throw Object.assign(new Error("Thiếu tên địa điểm"), { status: 400 });
    }

    const place = await prisma.$transaction(async (tx) => {
      const created = await tx.place.create({
        data: {
          name,
          address: input.address?.trim() || name,
          city: input.city?.trim() || "Hà Nội",
        },
      });

      const zones = input.zones?.filter((z) => z.name?.trim()) ?? [];
      for (const z of zones) {
        await tx.zone.create({
          data: {
            placeId: created.id,
            name: z.name.trim(),
            hasSeats: z.hasSeats ?? true,
          },
        });
      }

      return tx.place.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          zones: {
            include: { _count: { select: { seats: true } } },
          },
          _count: { select: { events: true } },
        },
      });
    });

    return place;
  }

  static async updatePlace(id: number, input: UpdatePlaceInput) {
    const existing = await prisma.place.findUnique({
      where: { id },
      include: {
        zones: { select: { id: true } },
      },
    });
    if (!existing) {
      throw Object.assign(new Error("Không tìm thấy địa điểm"), { status: 404 });
    }

    const name = input.name?.trim();
    if (name !== undefined && !name) {
      throw Object.assign(new Error("Thiếu tên địa điểm"), { status: 400 });
    }

    const zonePayload = input.zones;
    if (zonePayload) {
      const cleaned = zonePayload
        .map((z) => ({
          id: z.id,
          name: z.name?.trim() ?? "",
          hasSeats: z.hasSeats ?? true,
        }))
        .filter((z) => z.name);
      if (!cleaned.length) {
        throw Object.assign(new Error("Cần ít nhất 1 khu vực (zone)"), {
          status: 400,
        });
      }
      const names = cleaned.map((z) => z.name.toLowerCase());
      if (new Set(names).size !== names.length) {
        throw Object.assign(new Error("Tên khu vực không được trùng"), {
          status: 400,
        });
      }

      const keepIds = cleaned
        .map((z) => z.id)
        .filter((zid): zid is number => typeof zid === "number" && zid > 0);
      const toRemove = existing.zones
        .map((z) => z.id)
        .filter((zid) => !keepIds.includes(zid));

      if (toRemove.length) {
        const linked = await prisma.eventZone.count({
          where: { zoneId: { in: toRemove } },
        });
        if (linked > 0) {
          throw Object.assign(
            new Error(
              "Không xóa được zone đang gắn sự kiện. Hãy giữ zone đó hoặc xóa sự kiện trước.",
            ),
            { status: 409 },
          );
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.place.update({
          where: { id },
          data: {
            ...(name != null ? { name } : {}),
            ...(input.address != null
              ? { address: input.address.trim() || name || existing.name }
              : {}),
            ...(input.city != null
              ? { city: input.city.trim() || existing.city }
              : {}),
          },
        });

        if (toRemove.length) {
          await tx.seat.deleteMany({ where: { zoneId: { in: toRemove } } });
          await tx.zone.deleteMany({ where: { id: { in: toRemove } } });
        }

        for (const z of cleaned) {
          if (z.id && existing.zones.some((ez) => ez.id === z.id)) {
            await tx.zone.update({
              where: { id: z.id },
              data: { name: z.name, hasSeats: z.hasSeats },
            });
          } else {
            await tx.zone.create({
              data: {
                placeId: id,
                name: z.name,
                hasSeats: z.hasSeats,
              },
            });
          }
        }
      });
    } else {
      await prisma.place.update({
        where: { id },
        data: {
          ...(name != null ? { name } : {}),
          ...(input.address != null
            ? { address: input.address.trim() || name || existing.name }
            : {}),
          ...(input.city != null
            ? { city: input.city.trim() || existing.city }
            : {}),
        },
      });
    }

    return prisma.place.findUniqueOrThrow({
      where: { id },
      include: {
        zones: {
          include: { _count: { select: { seats: true } } },
        },
        _count: { select: { events: true } },
      },
    });
  }

  static async deletePlace(id: number) {
    const place = await prisma.place.findUnique({
      where: { id },
      include: {
        _count: { select: { events: true } },
        zones: { select: { id: true } },
      },
    });
    if (!place) {
      throw Object.assign(new Error("Không tìm thấy địa điểm"), { status: 404 });
    }
    if (place._count.events > 0) {
      throw Object.assign(
        new Error(
          `Không xóa được — địa điểm đang gắn ${place._count.events} sự kiện. Hãy xóa/đổi sự kiện trước.`,
        ),
        { status: 409 },
      );
    }

    const zoneIds = place.zones.map((z) => z.id);
    if (zoneIds.length) {
      const linked = await prisma.eventZone.count({
        where: { zoneId: { in: zoneIds } },
      });
      if (linked > 0) {
        throw Object.assign(
          new Error(
            "Không xóa được — zone của địa điểm vẫn đang được sự kiện sử dụng.",
          ),
          { status: 409 },
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      if (zoneIds.length) {
        await tx.seat.deleteMany({ where: { zoneId: { in: zoneIds } } });
        await tx.zone.deleteMany({ where: { placeId: id } });
      }
      await tx.place.delete({ where: { id } });
    });

    return { id };
  }

  static async listOrganizers() {
    const organizerRole = await prisma.role.findUnique({
      where: { name: "organizer" },
    });
    const adminRole = await prisma.role.findUnique({
      where: { name: "admin" },
    });

    const roleIds = [organizerRole?.id, adminRole?.id].filter(
      (id): id is number => typeof id === "number",
    );

    const users = await prisma.user.findMany({
      where:
        roleIds.length > 0
          ? { roleId: { in: roleIds } }
          : {
              OR: [
                { googleId: { startsWith: "organizer:" } },
                { googleId: "demo-admin" },
              ],
            },
      include: { role: true },
      orderBy: { id: "desc" },
    });

    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      avatarUrl: u.avatarUrl,
      walletAddress: u.walletAddress,
      role: u.role?.name ?? "organizer",
      createdAt: u.createdAt,
    }));
  }

  static async createOrganizer(input: CreateOrganizerInput) {
    const fullName = input.fullName?.trim();
    const email = input.email?.trim().toLowerCase();
    if (!fullName) {
      throw Object.assign(new Error("Thiếu tên nhà cung cấp"), { status: 400 });
    }
    if (!email || !email.includes("@")) {
      throw Object.assign(new Error("Email nhà cung cấp không hợp lệ"), {
        status: 400,
      });
    }

    await ensureRole("admin", "Quản trị hệ thống");
    await ensureRole("customer", "Khách mua vé");
    const organizerRole = await ensureRole(
      "organizer",
      "Nhà cung cấp / Ban tổ chức sự kiện",
    );

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          fullName,
          avatarUrl: input.avatarUrl?.trim() || existing.avatarUrl,
          roleId: organizerRole.id,
        },
        include: { role: true },
      });
      return {
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        avatarUrl: updated.avatarUrl,
        walletAddress: updated.walletAddress,
        role: updated.role?.name ?? "organizer",
        createdAt: updated.createdAt,
      };
    }

    const googleId = `organizer:${email}`;
    const walletAddress =
      input.walletAddress?.trim() ||
      `org-wallet-${Buffer.from(email).toString("hex").slice(0, 32)}`;

    const created = await prisma.user.create({
      data: {
        fullName,
        email,
        googleId,
        walletAddress,
        avatarUrl: input.avatarUrl?.trim() || "",
        roleId: organizerRole.id,
      },
      include: { role: true },
    });

    return {
      id: created.id,
      fullName: created.fullName,
      email: created.email,
      avatarUrl: created.avatarUrl,
      walletAddress: created.walletAddress,
      role: created.role?.name ?? "organizer",
      createdAt: created.createdAt,
    };
  }

  static async updateOrganizer(id: number, input: UpdateOrganizerInput) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) {
      throw Object.assign(new Error("Không tìm thấy nhà cung cấp"), {
        status: 404,
      });
    }

    const fullName =
      input.fullName !== undefined ? input.fullName.trim() : undefined;
    const email =
      input.email !== undefined
        ? input.email.trim().toLowerCase()
        : undefined;

    if (fullName !== undefined && !fullName) {
      throw Object.assign(new Error("Thiếu tên nhà cung cấp"), { status: 400 });
    }
    if (email !== undefined && (!email || !email.includes("@"))) {
      throw Object.assign(new Error("Email nhà cung cấp không hợp lệ"), {
        status: 400,
      });
    }

    if (email && email !== user.email) {
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken) {
        throw Object.assign(new Error("Email đã được sử dụng"), { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(fullName != null ? { fullName } : {}),
        ...(email != null ? { email } : {}),
        ...(input.avatarUrl !== undefined
          ? { avatarUrl: input.avatarUrl.trim() || "" }
          : {}),
      },
      include: { role: true },
    });

    return {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      avatarUrl: updated.avatarUrl,
      walletAddress: updated.walletAddress,
      role: updated.role?.name ?? "organizer",
      createdAt: updated.createdAt,
    };
  }

  static async deleteOrganizer(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        _count: { select: { organizedEvents: true } },
      },
    });
    if (!user) {
      throw Object.assign(new Error("Không tìm thấy nhà cung cấp"), {
        status: 404,
      });
    }
    if (user.googleId === "demo-admin" || user.role?.name === "admin") {
      throw Object.assign(
        new Error("Không xóa được tài khoản admin hệ thống"),
        { status: 409 },
      );
    }
    if (user._count.organizedEvents > 0) {
      throw Object.assign(
        new Error(
          `Không xóa được — nhà cung cấp đang gắn ${user._count.organizedEvents} sự kiện.`,
        ),
        { status: 409 },
      );
    }

    await prisma.user.delete({ where: { id } });
    return { id };
  }

  static async getOrganizerById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) return null;
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      walletAddress: user.walletAddress,
      role: user.role?.name ?? null,
    };
  }
}
