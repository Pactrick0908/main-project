import { prisma } from "../lib/prisma.js";

export type CreateEventZoneInput = {
  /** Tái sử dụng zone có sẵn của địa điểm */
  zoneId?: number;
  name: string;
  price: number;
  totalSeats: number;
  /** true = khu có ghế (VIP/khán đài); false = đứng / GA */
  hasSeats?: boolean;
  /** Số hàng ghế — chỉ dùng khi hasSeats (vd: 10 hàng → A..J) */
  rowCount?: number;
  /** Sinh ghế vật lý trong DB (mặc định = hasSeats) */
  generateSeats?: boolean;
};

export type CreateEventInput = {
  title: string;
  description?: string;
  bannerUrl?: string;
  status?: string;
  organizerId: number;
  place?: { name: string; address: string; city: string };
  placeId?: number;
  startTime?: string;
  endTime?: string;
  zones: CreateEventZoneInput[];
};

/** Giới hạn sinh ghế để tránh timeout khi total lớn */
const MAX_GENERATED_SEATS = 500;

function serializeEvent(event: {
  id: number;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  status: string | null;
  ticketId: string | null;
  createdAt: Date;
  place: { id: number; name: string; address: string; city: string };
  schedules: Array<{
    id: number;
    startTime: Date;
    endTime: Date;
    status: string | null;
  }>;
  eventZones: Array<{
    id: number;
    price: unknown;
    totalSeats: number;
    zone: { id: number; name: string; hasSeats: boolean };
    _count?: { tickets: number };
  }>;
  _count?: { tickets: number };
}) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    bannerUrl: event.bannerUrl,
    status: event.status ?? "draft",
    ticketId: event.ticketId,
    createdAt: event.createdAt,
    place: event.place,
    schedules: event.schedules.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
    })),
    zones: event.eventZones.map((ez) => ({
      id: ez.id,
      name: ez.zone.name,
      zoneId: ez.zone.id,
      hasSeats: ez.zone.hasSeats,
      price: Number(ez.price),
      totalSeats: ez.totalSeats,
      soldTickets: ez._count?.tickets ?? 0,
    })),
    soldTickets: event._count?.tickets ?? 0,
  };
}

const eventInclude = {
  place: true,
  schedules: true,
  eventZones: {
    include: {
      zone: true,
      _count: { select: { tickets: true } },
    },
  },
  _count: { select: { tickets: true } },
} as const;

function rowLabel(rowIndex: number): string {
  // 0 -> A, 25 -> Z, 26 -> AA
  let n = rowIndex;
  let label = "";
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

async function generateSeatsForZone(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  zoneId: number,
  totalSeats: number,
  rowCount: number,
) {
  const existing = await tx.seat.count({ where: { zoneId } });
  const target = Math.min(totalSeats, MAX_GENERATED_SEATS);
  if (existing >= target) return existing;

  const rows = Math.max(1, Math.floor(rowCount));
  const seatsPerRow = Math.ceil(target / rows);

  const batch: Array<{ zoneId: number; rowName: string; seatNumber: number }> =
    [];
  let created = existing;
  for (let row = 0; row < rows && created < target; row++) {
    for (let seatNumber = 1; seatNumber <= seatsPerRow && created < target; seatNumber++) {
      // Skip seats that would already exist if regenerating mid-zone
      const globalIndex = row * seatsPerRow + (seatNumber - 1);
      if (globalIndex < existing) continue;
      batch.push({
        zoneId,
        rowName: rowLabel(row),
        seatNumber,
      });
      created++;
    }
  }

  const CHUNK = 100;
  for (let i = 0; i < batch.length; i += CHUNK) {
    await tx.seat.createMany({ data: batch.slice(i, i + CHUNK) });
  }
  return target;
}

function validateZones(zones: CreateEventZoneInput[]) {
  if (!zones?.length) {
    throw Object.assign(new Error("Cần ít nhất 1 hạng vé / khu vực"), {
      status: 400,
    });
  }

  const names = new Set<string>();
  for (const z of zones) {
    const name = z.name?.trim();
    if (!name) {
      throw Object.assign(new Error("Mỗi khu vực cần có tên"), { status: 400 });
    }
    const key = name.toLowerCase();
    if (names.has(key)) {
      throw Object.assign(new Error(`Trùng tên khu vực: ${name}`), {
        status: 400,
      });
    }
    names.add(key);

    if (!(Number(z.price) > 0)) {
      throw Object.assign(new Error(`Giá khu "${name}" phải > 0`), {
        status: 400,
      });
    }
    if (!Number.isInteger(Number(z.totalSeats)) || Number(z.totalSeats) < 1) {
      throw Object.assign(
        new Error(`Số lượng khu "${name}" phải là số nguyên ≥ 1`),
        { status: 400 },
      );
    }

    const hasSeats = z.hasSeats ?? true;
    if (hasSeats) {
      const rows = Number(z.rowCount);
      if (!Number.isInteger(rows) || rows < 1) {
        throw Object.assign(
          new Error(`Khu "${name}" (có ghế) cần số hàng ≥ 1`),
          { status: 400 },
        );
      }
      if (rows > Number(z.totalSeats)) {
        throw Object.assign(
          new Error(`Khu "${name}": số hàng không được lớn hơn tổng ghế`),
          { status: 400 },
        );
      }
    }
  }
}

export class EventService {
  static async list() {
    const events = await prisma.event.findMany({
      include: eventInclude,
      orderBy: { id: "desc" },
    });
    return events.map(serializeEvent);
  }

  static async getById(id: number) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: eventInclude,
    });
    if (!event) {
      throw Object.assign(new Error("Không tìm thấy sự kiện"), { status: 404 });
    }
    return serializeEvent(event);
  }

  /**
   * Nghiệp vụ tạo sự kiện:
   * Place (địa điểm) → Zone (khu vật lý, tái sử dụng theo place)
   * → EventZone (giá + cung cho sự kiện) → Seat (nếu hasSeats)
   */
  static async create(input: CreateEventInput) {
    if (!input.title?.trim()) {
      throw Object.assign(new Error("Thiếu tên sự kiện"), { status: 400 });
    }
    validateZones(input.zones);

    let placeId = input.placeId ?? null;
    if (!placeId) {
      if (!input.place?.name?.trim()) {
        throw Object.assign(new Error("Thiếu địa điểm"), { status: 400 });
      }
      const place = await prisma.place.create({
        data: {
          name: input.place.name.trim(),
          address: input.place.address?.trim() || input.place.name.trim(),
          city: input.place.city?.trim() || "Hà Nội",
        },
      });
      placeId = place.id;
    } else {
      const place = await prisma.place.findUnique({ where: { id: placeId } });
      if (!place) {
        throw Object.assign(new Error("Địa điểm không tồn tại"), { status: 404 });
      }
    }

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          title: input.title.trim(),
          description: input.description ?? null,
          bannerUrl: input.bannerUrl ?? null,
          status: input.status ?? "active",
          organizerId: input.organizerId,
          placeId: placeId!,
        },
      });

      if (input.startTime && input.endTime) {
        const start = new Date(input.startTime);
        const end = new Date(input.endTime);
        if (!(end > start)) {
          throw Object.assign(new Error("endTime phải sau startTime"), {
            status: 400,
          });
        }
        await tx.eventSchedule.create({
          data: {
            eventId: created.id,
            startTime: start,
            endTime: end,
            status: "open",
          },
        });
      }

      for (const z of input.zones) {
        const hasSeats = z.hasSeats ?? true;
        const name = z.name.trim();
        let zoneId = z.zoneId ?? null;

        if (zoneId) {
          const existingZone = await tx.zone.findFirst({
            where: { id: zoneId, placeId: placeId! },
          });
          if (!existingZone) {
            throw Object.assign(
              new Error(`Zone #${zoneId} không thuộc địa điểm đã chọn`),
              { status: 400 },
            );
          }
          zoneId = existingZone.id;
        } else {
          // Tái sử dụng zone cùng tên trong Place (khu vật lý gắn địa điểm)
          const placeZones = await tx.zone.findMany({
            where: { placeId: placeId! },
          });
          const byName = placeZones.find(
            (pz) => pz.name.trim().toLowerCase() === name.toLowerCase(),
          );
          if (byName) {
            zoneId = byName.id;
            if (byName.hasSeats !== hasSeats) {
              await tx.zone.update({
                where: { id: byName.id },
                data: { hasSeats },
              });
            }
          } else {
            const createdZone = await tx.zone.create({
              data: { placeId: placeId!, name, hasSeats },
            });
            zoneId = createdZone.id;
          }
        }

        // Một sự kiện không gắn 2 lần cùng zone
        const dup = await tx.eventZone.findFirst({
          where: { eventId: created.id, zoneId },
        });
        if (dup) {
          throw Object.assign(
            new Error(`Khu "${name}" đã được gắn vào sự kiện`),
            { status: 400 },
          );
        }

        await tx.eventZone.create({
          data: {
            eventId: created.id,
            zoneId,
            price: z.price,
            totalSeats: z.totalSeats,
          },
        });

        const shouldGenerate = z.generateSeats ?? hasSeats;
        if (shouldGenerate) {
          const rowCount = Math.max(1, Math.floor(Number(z.rowCount) || 1));
          await generateSeatsForZone(tx, zoneId, z.totalSeats, rowCount);
        }
      }

      return tx.event.findUniqueOrThrow({
        where: { id: created.id },
        include: eventInclude,
      });
    });

    return serializeEvent(event);
  }

  static async update(
    id: number,
    data: {
      title?: string;
      description?: string;
      bannerUrl?: string;
      status?: string;
    },
  ) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw Object.assign(new Error("Không tìm thấy sự kiện"), { status: 404 });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(data.title != null ? { title: data.title } : {}),
        ...(data.description != null ? { description: data.description } : {}),
        ...(data.bannerUrl != null ? { bannerUrl: data.bannerUrl } : {}),
        ...(data.status != null ? { status: data.status } : {}),
      },
      include: eventInclude,
    });

    return serializeEvent(updated);
  }

  static async remove(id: number) {
    const sold = await prisma.ticket.count({
      where: {
        eventId: id,
        status: { in: ["sold", "checked_in", "valid"] },
      },
    });
    if (sold > 0) {
      throw Object.assign(
        new Error(
          "Không xóa được — sự kiện đã có vé bán. Hãy chuyển sang ended.",
        ),
        { status: 409 },
      );
    }

    await prisma.$transaction([
      prisma.eventZone.deleteMany({ where: { eventId: id } }),
      prisma.eventSchedule.deleteMany({ where: { eventId: id } }),
      prisma.ticket.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } }),
    ]);

    return { id };
  }

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
}
