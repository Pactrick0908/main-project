import { prisma } from "../lib/prisma.js";
import {
  assertCanDeleteEvent,
  assertCanUpdateEvent,
  assertZoneCapacityChange,
  BOOKED_TICKET_STATUSES,
  buildEventEditPolicy,
  isValidEventStatus,
  normalizeEventStatus,
  type EventEditPolicy,
} from "./eventPolicy.js";

export type CreateEventZoneInput = {
  /** EventZone.id khi sửa khu đã gắn sự kiện */
  eventZoneId?: number;
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
  /** Tên nhà tổ chức hiển thị */
  organizerName?: string;
  /** Poster sự kiện */
  bannerUrl?: string;
  /** Ảnh sơ đồ chỗ ngồi */
  mapUrl?: string;
  /** Ảnh / logo nhà tổ chức */
  logoUrl?: string;
  status?: string;
  organizerId?: number | null;
  place?: { name: string; address: string; city: string };
  placeId?: number;
  startTime?: string;
  endTime?: string;
  zones: CreateEventZoneInput[];
  /** Line-up nghệ sĩ gắn sự kiện */
  artistIds?: number[];
  isFeatured?: boolean;
};

/** Giới hạn sinh ghế để tránh timeout khi total lớn */
const MAX_GENERATED_SEATS = 300;

function serializeEvent(event: {
  id: number;
  title: string;
  description: string | null;
  organizerName?: string | null;
  bannerUrl: string | null;
  mapUrl?: string | null;
  logoUrl?: string | null;
  status: string | null;
  ticketId: string | null;
  createdAt: Date;
  place: { id: number; name: string; address: string; city: string };
  organizer?: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
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
    row?: number | null;
    zone: {
      id: number;
      name: string;
      hasSeats: boolean;
      _count?: { seats: number };
      seats?: Array<{ rowName: string }>;
    };
    _count?: { tickets: number };
    tickets?: Array<{
      seatId: number | null;
      status: string | null;
      seat: { rowName: string; seatNumber: number } | null;
    }>;
  }>;
  eventArtists?: Array<{
    role: string | null;
    artist: {
      id: number;
      name: string;
      stageName: string | null;
      avatarUrl: string | null;
      genre: string | null;
    };
  }>;
  _count?: { tickets: number };
  isFeatured?: boolean;
}) {
  const ZONE_COLORS = [
    "#F97316",
    "#EAB308",
    "#3B82F6",
    "#10B981",
    "#A855F7",
    "#EF4444",
  ];

  const organizerDisplay =
    event.organizerName?.trim() ||
    event.organizer?.fullName ||
    "Ban tổ chức";

  const soldTicketsTotal = event._count?.tickets ?? 0;
  // Ưu tiên đếm vé đã đặt theo status nếu đã load tickets (chi tiết)
  let bookedFromTickets = 0;
  for (const ez of event.eventZones) {
    for (const t of ez.tickets ?? []) {
      if (
        t.status &&
        (BOOKED_TICKET_STATUSES as readonly string[]).includes(t.status)
      ) {
        bookedFromTickets++;
      }
    }
  }
  const hasBookings =
    bookedFromTickets > 0 || soldTicketsTotal > 0;

  const artists = (event.eventArtists ?? []).map((ea) => ({
    id: ea.artist.id,
    name: ea.artist.name,
    stageName: ea.artist.stageName,
    avatarUrl: ea.artist.avatarUrl,
    genre: ea.artist.genre,
    role: ea.role ?? "performer",
  }));
  const artistLineup = artists
    .map((a) => a.stageName?.trim() || a.name)
    .filter(Boolean)
    .join(", ");

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    organizerName: event.organizerName ?? null,
    organizerId: event.organizer?.id ?? null,
    organizer: organizerDisplay,
    bannerUrl: event.bannerUrl,
    bannerImage: event.bannerUrl,
    mapUrl: event.mapUrl ?? null,
    logoUrl: event.logoUrl ?? null,
    ticketId: event.ticketId,
    createdAt: event.createdAt,
    place: event.place,
    venue: event.place?.name,
    address: event.place?.address,
    city: event.place?.city,
    artist: artistLineup || organizerDisplay,
    artists,
    schedules: event.schedules.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
    })),
    zones: event.eventZones.map((ez, idx) => {
      // Số hàng cấu hình từ event_zones.row (công thức total_seats / row)
      const rowCount =
        ez.row && ez.row > 0
          ? ez.row
          : ez.zone.hasSeats
            ? Math.max(1, Math.round(Math.sqrt(ez.totalSeats)))
            : undefined;

      // Ghế đã gắn ticket.seatId → ẩn trên sơ đồ
      const soldSeats = (ez.tickets ?? [])
        .filter((t) => t.seatId != null && t.seat)
        .map((t) => `${t.seat!.rowName}${t.seat!.seatNumber}`);

      return {
        id: ez.id,
        eventZoneId: ez.id,
        name: ez.zone.name,
        zoneId: ez.zone.id,
        hasSeats: ez.zone.hasSeats,
        price: Number(ez.price),
        totalSeats: ez.totalSeats,
        row: ez.row ?? null,
        available: Math.max(0, ez.totalSeats - (ez._count?.tickets ?? 0)),
        rowCount,
        soldSeats,
        color: ZONE_COLORS[idx % ZONE_COLORS.length],
        soldTickets: ez._count?.tickets ?? 0,
        benefits: ez.zone.hasSeats
          ? ["Ghế ngồi cố định có mã định danh", "Check-in QR"]
          : ["Vé vào cửa khu vực đứng", "Check-in QR"],
      };
    }),
    soldTickets: soldTicketsTotal,
    isFeatured: Boolean(event.isFeatured),
    status: normalizeEventStatus(event.status),
    editPolicy: buildEventEditPolicy(event.status, hasBookings),
    organizerInfo: event.organizer
      ? {
          id: event.organizer.id,
          fullName: event.organizer.fullName,
          email: event.organizer.email,
          avatarUrl: event.logoUrl || event.organizer.avatarUrl || null,
        }
      : undefined,
  };
}

const eventIncludeList = {
  place: true,
  organizer: {
    select: { id: true, fullName: true, email: true, avatarUrl: true },
  },
  schedules: true,
  eventArtists: {
    include: {
      artist: {
        select: {
          id: true,
          name: true,
          stageName: true,
          avatarUrl: true,
          genre: true,
        },
      },
    },
  },
  eventZones: {
    include: {
      zone: true,
      _count: { select: { tickets: true } },
    },
  },
  _count: { select: { tickets: true } },
} as const;

/** Chi tiết: kèm ghế đã bán để ẩn trên sơ đồ */
const eventInclude = {
  place: true,
  organizer: {
    select: { id: true, fullName: true, email: true, avatarUrl: true },
  },
  schedules: true,
  eventArtists: {
    include: {
      artist: {
        select: {
          id: true,
          name: true,
          stageName: true,
          avatarUrl: true,
          genre: true,
        },
      },
    },
  },
  eventZones: {
    include: {
      zone: {
        include: {
          seats: { select: { id: true, rowName: true, seatNumber: true } },
          _count: { select: { seats: true } },
        },
      },
      tickets: {
        where: {
          seatId: { not: null },
        },
        select: {
          seatId: true,
          status: true,
          seat: { select: { rowName: true, seatNumber: true } },
        },
      },
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

  // 200/10 → 10×20; 200/11 → 11×18 + 1×2
  let requestedRows = Math.max(1, Math.floor(rowCount));
  requestedRows = Math.min(requestedRows, target);

  let seatsInRow: number[];
  if (requestedRows >= target) {
    seatsInRow = Array.from({ length: target }, () => 1);
  } else {
    const base = Math.floor(target / requestedRows);
    const rem = target % requestedRows;
    seatsInRow =
      rem === 0
        ? Array.from({ length: requestedRows }, () => base)
        : [...Array.from({ length: requestedRows }, () => base), rem];
  }

  const batch: Array<{ zoneId: number; rowName: string; seatNumber: number }> =
    [];
  let created = existing;
  let globalIndex = 0;

  for (let row = 0; row < seatsInRow.length && created < target; row++) {
    const count = seatsInRow[row];
    for (let seatNumber = 1; seatNumber <= count && created < target; seatNumber++) {
      if (globalIndex < existing) {
        globalIndex++;
        continue;
      }
      batch.push({
        zoneId,
        rowName: rowLabel(row),
        seatNumber,
      });
      created++;
      globalIndex++;
    }
  }

  const CHUNK = 100;
  for (let i = 0; i < batch.length; i += CHUNK) {
    await tx.seat.createMany({
      data: batch.slice(i, i + CHUNK),
      skipDuplicates: true,
    });
  }
  return target;
}

async function resolveZoneForPlace(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  placeId: number,
  z: CreateEventZoneInput,
): Promise<number> {
  const hasSeats = z.hasSeats ?? true;
  const name = z.name.trim();
  if (z.zoneId) {
    const existingZone = await tx.zone.findFirst({
      where: { id: z.zoneId, placeId },
    });
    if (existingZone) {
      if (existingZone.hasSeats !== hasSeats) {
        await tx.zone.update({
          where: { id: existingZone.id },
          data: { hasSeats },
        });
      }
      return existingZone.id;
    }
  }

  const placeZones = await tx.zone.findMany({ where: { placeId } });
  const byName = placeZones.find(
    (pz: { name: string }) => pz.name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (byName) {
    if (byName.hasSeats !== hasSeats) {
      await tx.zone.update({
        where: { id: byName.id },
        data: { hasSeats },
      });
    }
    return byName.id;
  }

  const createdZone = await tx.zone.create({
    data: { placeId, name, hasSeats },
  });
  return createdZone.id;
}

async function syncEventZones(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  eventId: number,
  placeId: number,
  zones: CreateEventZoneInput[],
  policy: EventEditPolicy,
) {
  const existing = await tx.eventZone.findMany({
    where: { eventId },
    include: {
      zone: true,
      _count: { select: { tickets: true } },
    },
  });

  const incomingIds = new Set(
    zones
      .map((z) => Number(z.eventZoneId))
      .filter((id) => Number.isInteger(id) && id > 0),
  );

  if (policy.canModifyZones) {
    for (const ez of existing) {
      if (incomingIds.has(ez.id)) continue;
      if (!policy.canDecreaseSeats) {
        throw Object.assign(
          new Error(
            `Đang mở bán — không xóa khu "${ez.zone.name}" (không giảm số ghế).`,
          ),
          { status: 409 },
        );
      }
      if (ez._count.tickets > 0) {
        throw Object.assign(
          new Error(`Không xóa khu "${ez.zone.name}" — đã có vé bán`),
          { status: 409 },
        );
      }
      await tx.eventZone.delete({ where: { id: ez.id } });
    }
  }

  for (const z of zones) {
    const hasSeats = z.hasSeats ?? true;
    const row =
      hasSeats && z.rowCount
        ? Math.max(1, Math.floor(Number(z.rowCount)))
        : null;
    const eventZoneId = Number(z.eventZoneId);
    const ez =
      Number.isInteger(eventZoneId) && eventZoneId > 0
        ? existing.find((rowEz: { id: number }) => rowEz.id === eventZoneId)
        : undefined;

    if (ez) {
      assertZoneCapacityChange(ez._count.tickets, Number(z.totalSeats), z.name, {
        currentTotal: Number(ez.totalSeats),
        canDecreaseSeats: policy.canDecreaseSeats,
      });
      if (
        policy.canChangePrice === false &&
        Number(z.price) !== Number(ez.price)
      ) {
        throw Object.assign(
          new Error(`Không đổi giá khu "${ez.zone.name}" ở trạng thái này.`),
          { status: 403 },
        );
      }
      const zoneId = policy.canModifyZones
        ? await resolveZoneForPlace(tx, placeId, z)
        : ez.zoneId;
      await tx.eventZone.update({
        where: { id: ez.id },
        data: {
          ...(policy.canModifyZones ? { zoneId, row } : {}),
          totalSeats: Number(z.totalSeats),
          ...(policy.canChangePrice ? { price: z.price } : {}),
        },
      });
      if (hasSeats) {
        await generateSeatsForZone(
          tx,
          zoneId,
          Number(z.totalSeats),
          row || 1,
        );
      }
      continue;
    }

    if (!policy.canAddZone && !policy.canModifyZones) {
      throw Object.assign(new Error(`Không thêm được khu "${z.name}"`), {
        status: 403,
      });
    }

    const zoneId = await resolveZoneForPlace(tx, placeId, z);
    const dup = await tx.eventZone.findFirst({
      where: { eventId, zoneId },
    });
    if (dup) {
      throw Object.assign(new Error(`Khu "${z.name}" đã gắn sự kiện này`), {
        status: 400,
      });
    }
    await tx.eventZone.create({
      data: {
        eventId,
        zoneId,
        price: z.price,
        totalSeats: Number(z.totalSeats),
        row,
      },
    });
    if (z.generateSeats ?? hasSeats) {
      await generateSeatsForZone(tx, zoneId, Number(z.totalSeats), row || 1);
    }
  }
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
  /**
   * JWT có thể mang userId cũ (DB reset / user bị xóa).
   * Resolve → user thật; nếu không có thì tạo user từ thông tin JWT.
   */
  static async resolveOrganizerId(auth: {
    userId?: number;
    googleId?: string;
    email?: string;
    walletAddress?: string;
  }): Promise<number> {
    if (auth.userId && Number.isFinite(Number(auth.userId))) {
      const byId = await prisma.user.findUnique({
        where: { id: Number(auth.userId) },
        select: { id: true },
      });
      if (byId) return byId.id;
    }

    if (auth.googleId || auth.email) {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            ...(auth.googleId ? [{ googleId: auth.googleId }] : []),
            ...(auth.email ? [{ email: auth.email }] : []),
          ],
        },
        select: { id: true },
      });
      if (existing) return existing.id;
    }

    // Tạo user tối thiểu để thỏa FK events_organizer_id_fkey
    const googleId = auth.googleId || `org-${Date.now()}`;
    const email =
      auth.email ||
      `${googleId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) || "org"}@ticket.local`;
    const walletAddress =
      auth.walletAddress || `pending-${googleId}`.slice(0, 100);

    try {
      const created = await prisma.user.create({
        data: {
          googleId,
          email,
          fullName: "Ban tổ chức",
          walletAddress,
          avatarUrl: "",
        },
        select: { id: true },
      });
      return created.id;
    } catch {
      // Race / email trùng — tìm lại
      const again = await prisma.user.findFirst({
        where: {
          OR: [{ googleId }, { email }],
        },
        select: { id: true },
      });
      if (again) return again.id;
      throw Object.assign(
        new Error("Không xác định được nhà tổ chức (user). Hãy đăng nhập lại Admin."),
        { status: 401 },
      );
    }
  }

  static async list(statusFilter?: string, featuredOnly?: boolean) {
    const events = await prisma.event.findMany({
      where: featuredOnly ? { isFeatured: true } : undefined,
      include: eventIncludeList,
      orderBy: { id: "desc" },
    });
    const serialized = events.map(serializeEvent);
    const wanted = String(statusFilter ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => normalizeEventStatus(s));
    let result = wanted.length
      ? serialized.filter((e) =>
          wanted.includes(e.status as (typeof wanted)[number]),
        )
      : serialized;
    if (featuredOnly) {
      result = result.filter((e) => {
        const st = String(e.status || "").toLowerCase();
        return st === "upcoming" || st === "open";
      });
    }
    return result;
  }

  /**
   * Tìm concert / nghệ sĩ cho client.
   * - q rỗng: trả hotKeywords + upcoming (2–3 sự kiện)
   * - có q: events + artists khớp
   */
  static async search(q?: string) {
    const query = q?.trim() ?? "";

    const [allEvents, allArtists] = await Promise.all([
      prisma.event.findMany({
        include: eventIncludeList,
        orderBy: { id: "desc" },
        take: 80,
      }),
      prisma.artist.findMany({
        include: { _count: { select: { eventArtists: true } } },
        orderBy: { id: "desc" },
        take: 80,
      }),
    ]);

    const serialized = allEvents
      .map(serializeEvent)
      .filter((e) => {
        const st = String(e.status || "").toLowerCase();
        return st === "upcoming" || st === "open";
      });

    // Từ khóa nổi bật: nghệ sĩ có gắn sự kiện + một số title sự kiện
    const artistKeywords = allArtists
      .slice()
      .sort(
        (a, b) =>
          (b._count?.eventArtists ?? 0) - (a._count?.eventArtists ?? 0),
      )
      .slice(0, 12)
      .map((a) => a.stageName?.trim() || a.name);
    const eventKeywords = serialized
      .slice(0, 8)
      .map((e) => e.title.split(/[—\-|:]/)[0]?.trim())
      .filter(Boolean) as string[];
    const hotKeywords = [
      ...new Set([...artistKeywords, ...eventKeywords].filter(Boolean)),
    ].slice(0, 10);

    // Chỉ sự kiện upcoming (carousel / gợi ý)
    const upcoming = serialized
      .filter((e) => String(e.status || "").toLowerCase() === "upcoming")
      .slice(0, 6);

    if (!query) {
      const stars = allArtists
        .slice()
        .sort(
          (a, b) =>
            (b._count?.eventArtists ?? 0) - (a._count?.eventArtists ?? 0),
        )
        .slice(0, 12)
        .map((a) => ({
          id: a.id,
          name: a.name,
          stageName: a.stageName,
          avatarUrl: a.avatarUrl,
          eventCount: a._count?.eventArtists ?? 0,
        }));

      return {
        query: "",
        events: [],
        artists: stars,
        hotKeywords,
        upcoming,
      };
    }

    const qLower = query.toLowerCase();
    const events = serialized.filter((e) => {
      const hay = [
        e.title,
        e.description,
        e.artist,
        e.venue,
        e.city,
        e.place?.name,
        ...(e.artists ?? []).map(
          (a: { name: string; stageName?: string | null }) =>
            `${a.name} ${a.stageName ?? ""}`,
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qLower);
    });

    const artists = allArtists
      .filter((a) => {
        const hay = `${a.name} ${a.stageName ?? ""}`.toLowerCase();
        return hay.includes(qLower);
      })
      .map((a) => ({
        id: a.id,
        name: a.name,
        stageName: a.stageName,
        avatarUrl: a.avatarUrl,
        eventCount: a._count?.eventArtists ?? 0,
      }));

    return {
      query,
      events,
      artists,
      hotKeywords,
      upcoming,
    };
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

    // Xác nhận organizer còn tồn tại trước khi tạo event (tránh FK)
    let organizerId: number | null = input.organizerId
      ? Number(input.organizerId)
      : null;
    if (organizerId) {
      const org = await prisma.user.findUnique({
        where: { id: organizerId },
        select: { id: true },
      });
      if (!org) {
        organizerId = null;
      }
    }

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

    const event = await prisma.$transaction(
      async (tx) => {
      const created = await tx.event.create({
        data: {
          title: input.title.trim(),
          description: input.description ?? null,
          organizerName: input.organizerName?.trim() || null,
          bannerUrl: input.bannerUrl?.trim() || null,
          mapUrl: input.mapUrl?.trim() || null,
          logoUrl: input.logoUrl?.trim() || null,
          status: input.status ?? "draft",
          isFeatured: Boolean(input.isFeatured),
          organizerId,
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
            row:
              hasSeats && z.rowCount
                ? Math.max(1, Math.floor(Number(z.rowCount)))
                : null,
          },
        });

        const shouldGenerate = z.generateSeats ?? hasSeats;
        if (shouldGenerate) {
          const rowCount = Math.max(1, Math.floor(Number(z.rowCount) || 1));
          await generateSeatsForZone(tx, zoneId, z.totalSeats, rowCount);
        }
      }

      const artistIds = [
        ...new Set(
          (input.artistIds ?? [])
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0),
        ),
      ];
      if (artistIds.length) {
        const found = await tx.artist.findMany({
          where: { id: { in: artistIds } },
          select: { id: true },
        });
        const foundIds = new Set(found.map((a) => a.id));
        const missing = artistIds.filter((id) => !foundIds.has(id));
        if (missing.length) {
          throw Object.assign(
            new Error(`Nghệ sĩ không tồn tại: #${missing.join(", #")}`),
            { status: 400 },
          );
        }
        await tx.eventArtist.createMany({
          data: artistIds.map((artistId) => ({
            eventId: created.id,
            artistId,
            role: "performer",
          })),
          skipDuplicates: true,
        });
      }

      return tx.event.findUniqueOrThrow({
        where: { id: created.id },
        // Dùng include nhẹ sau tạo — không load hết ghế
        include: eventIncludeList,
      });
    },
      { timeout: 60_000, maxWait: 10_000 },
    );

    return serializeEvent(event);
  }

  static async update(
    id: number,
    data: {
      title?: string;
      description?: string;
      organizerName?: string;
      bannerUrl?: string;
      mapUrl?: string;
      logoUrl?: string;
      status?: string;
      placeId?: number;
      zones?: unknown;
      startTime?: string;
      endTime?: string;
      isFeatured?: boolean;
    },
  ) {
    const existing = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { tickets: true } } },
    });
    if (!existing) {
      throw Object.assign(new Error("Không tìm thấy sự kiện"), { status: 404 });
    }

    const bookedCount = await prisma.ticket.count({
      where: {
        eventId: id,
        status: { in: [...BOOKED_TICKET_STATUSES] },
      },
    });
    const hasBookings = bookedCount > 0;
    const policy = buildEventEditPolicy(existing.status, hasBookings);

    if (data.status != null && !isValidEventStatus(String(data.status))) {
      throw Object.assign(
        new Error(
          "Trạng thái không hợp lệ. Dùng: draft | upcoming | open | ended",
        ),
        { status: 400 },
      );
    }

    assertCanUpdateEvent(policy, data as Record<string, unknown>);

    const nextStatus =
      data.status != null
        ? normalizeEventStatus(String(data.status))
        : undefined;

    const zonePayload = Array.isArray(data.zones)
      ? (data.zones as CreateEventZoneInput[])
      : undefined;
    if (zonePayload) validateZones(zonePayload);

    if (
      data.startTime &&
      data.endTime &&
      !(new Date(data.endTime) > new Date(data.startTime))
    ) {
      throw Object.assign(new Error("endTime phải sau startTime"), {
        status: 400,
      });
    }

    const updated = await prisma.$transaction(
      async (tx) => {
        let placeId = existing.placeId;
        if (policy.canChangePlace && data.placeId != null) {
          const place = await tx.place.findUnique({
            where: { id: Number(data.placeId) },
          });
          if (!place) {
            throw Object.assign(new Error("Địa điểm không tồn tại"), {
              status: 404,
            });
          }
          placeId = place.id;
        }

        await tx.event.update({
          where: { id },
          data: {
            ...(data.title != null ? { title: data.title } : {}),
            ...(data.description != null ? { description: data.description } : {}),
            ...(data.organizerName != null
              ? { organizerName: data.organizerName.trim() || null }
              : {}),
            ...(data.bannerUrl != null
              ? { bannerUrl: data.bannerUrl || null }
              : {}),
            ...(data.mapUrl != null ? { mapUrl: data.mapUrl || null } : {}),
            ...(data.logoUrl != null ? { logoUrl: data.logoUrl || null } : {}),
            ...(nextStatus != null ? { status: nextStatus } : {}),
            ...(data.isFeatured != null
              ? { isFeatured: Boolean(data.isFeatured) }
              : {}),
            ...(policy.canChangePlace && data.placeId != null
              ? { placeId }
              : {}),
          },
        });

        if (
          data.startTime &&
          data.endTime &&
          (policy.canEditAll || policy.canEditSensitive)
        ) {
          const start = new Date(data.startTime);
          const end = new Date(data.endTime);
          const sched = await tx.eventSchedule.findFirst({
            where: { eventId: id },
            orderBy: { id: "asc" },
          });
          if (sched) {
            await tx.eventSchedule.update({
              where: { id: sched.id },
              data: { startTime: start, endTime: end },
            });
          } else {
            await tx.eventSchedule.create({
              data: {
                eventId: id,
                startTime: start,
                endTime: end,
                status: "open",
              },
            });
          }
        }

        if (zonePayload) {
          await syncEventZones(tx, id, placeId, zonePayload, policy);
        }

        return tx.event.findUniqueOrThrow({
          where: { id },
          include: eventInclude,
        });
      },
      { timeout: 60_000, maxWait: 10_000 },
    );

    return serializeEvent(updated);
  }

  static async remove(id: number) {
    const existing = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { tickets: true } } },
    });
    if (!existing) {
      throw Object.assign(new Error("Không tìm thấy sự kiện"), { status: 404 });
    }

    const bookedCount = await prisma.ticket.count({
      where: {
        eventId: id,
        status: { in: [...BOOKED_TICKET_STATUSES] },
      },
    });
    const policy = buildEventEditPolicy(existing.status, bookedCount > 0);
    assertCanDeleteEvent(policy);

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
