import { prisma } from "../lib/prisma.js";

const DEFAULT_EVENT_COLORS = [
  "#F97316",
  "#EC4899",
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#EAB308",
];

const DEFAULT_EVENT_RULES = [
  "Vé đã phát hành có mã định danh và QR động, không hoàn trả dưới mọi hình thức trừ khi sự kiện bị hủy.",
  "Mỗi mã Dynamic QR chỉ có hiệu lực quét check-in 01 lần duy nhất tại cổng soát vé.",
  "Khán giả vui lòng xuất trình CCCD/VNeID hoặc thẻ căn cước trùng thông tin khi được kiểm tra.",
  "Nghiêm cấm mang vũ khí, chất cháy nổ, đồ uống có cồn, vật sắc nhọn và thiết bị ghi hình chuyên nghiệp.",
  "Trẻ em dưới 12 tuổi phải có người giám hộ đi kèm suốt thời gian diễn ra sự kiện.",
];

export interface SerializedEventZone {
  id: string;
  eventZoneId: number;
  zoneId: number;
  name: string;
  price: number;
  solPrice: number;
  available: number;
  totalSeats: number;
  color: string;
  benefits: string[];
}

export interface SerializedEvent {
  id: number;
  title: string;
  artist: string;
  category: string;
  bannerImage: string;
  thumbnail: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  city: string;
  description: string;
  organizer: string;
  ticketsAvailable: boolean;
  status: string;
  minPrice: number;
  maxPrice: number;
  priceRange: string;
  passCount: number;
  zones: SerializedEventZone[];
  rules: string[];
  organizerInfo?: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  } | undefined;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

function formatDateVietnamese(date: Date): string {
  try {
    const days = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const dayName = days[date.getDay()];
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${dayName}, ${d}/${m}/${y}`;
  } catch {
    return "Sắp diễn ra";
  }
}

function formatTimeVietnamese(date: Date): string {
  try {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes} (Mở cổng trước 2h)`;
  } catch {
    return "19:30";
  }
}

export class EventService {
  /**
   * Serialize Prisma Event to frontend-compatible structure
   */
  static serializeEvent(event: any): SerializedEvent {
    const firstSchedule = event.schedules?.[0];
    const eventDate = firstSchedule?.startTime
      ? formatDateVietnamese(new Date(firstSchedule.startTime))
      : "Đang cập nhật ngày";
    const eventTime = firstSchedule?.startTime
      ? formatTimeVietnamese(new Date(firstSchedule.startTime))
      : "19:30";

    const zones: SerializedEventZone[] = (event.eventZones || []).map(
      (ez: any, idx: number) => {
        const price = Number(ez.price || 0);
        const ticketCount = ez._count?.tickets ?? ez.tickets?.length ?? 0;
        const available = Math.max(0, (ez.totalSeats || 50) - ticketCount);

        const benefits = [
          "Ghế ngồi tiêu chuẩn chính hãng",
          "Mã Dynamic QR chống chụp màn hình",
          "Bảo hiểm vé & hỗ trợ check-in nhanh",
        ];
        if (price >= 2000000) {
          benefits.unshift("Lối đi riêng VIP & Quà lưu niệm độc quyền");
        }

        return {
          id: String(ez.id),
          eventZoneId: ez.id,
          zoneId: ez.zoneId,
          name: ez.zone?.name || `Khu vực ${idx + 1}`,
          price,
          solPrice: Number((price / 4800000).toFixed(3)),
          available,
          totalSeats: ez.totalSeats || 50,
          color: DEFAULT_EVENT_COLORS[idx % DEFAULT_EVENT_COLORS.length],
          benefits,
        };
      },
    );

    const prices = zones.map((z) => z.price).filter((p) => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;

    let priceRange = "Đang cập nhật";
    if (prices.length > 0) {
      if (minPrice === maxPrice) {
        priceRange = formatVND(minPrice);
      } else {
        priceRange = `${formatVND(minPrice)} – ${formatVND(maxPrice)}`;
      }
    }

    const defaultBanner =
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80";

    return {
      id: event.id,
      title: event.title,
      artist: event.organizer?.fullName || "Nghệ sĩ biểu diễn",
      category: "Concert",
      bannerImage: event.bannerUrl || defaultBanner,
      thumbnail: event.bannerUrl || defaultBanner,
      date: eventDate,
      time: eventTime,
      venue: event.place?.name || "Địa điểm tổ chức",
      address: event.place?.address || "",
      city: event.place?.city || "Hà Nội",
      description:
        event.description ||
        `Sự kiện âm nhạc đỉnh cao với hệ thống âm thanh ánh sáng chuẩn quốc tế. Toàn bộ vé phát hành chính hãng có mã định danh chống giả và công nghệ Dynamic QR xoay vòng bảo mật.`,
      organizer: event.organizer?.fullName || "Ban Tổ Chức Sự Kiện",
      ticketsAvailable: event.status === "active" || event.status === "open",
      status: event.status || "draft",
      minPrice,
      maxPrice,
      priceRange,
      passCount: event._count?.tickets || 0,
      zones,
      rules: DEFAULT_EVENT_RULES,
      organizerInfo: event.organizer
        ? {
            id: event.organizer.id,
            fullName: event.organizer.fullName,
            email: event.organizer.email,
            avatarUrl: event.organizer.avatarUrl,
          }
        : undefined,
    };
  }

  /**
   * Lấy danh sách sự kiện từ DB
   */
  static async listEvents(query?: { status?: string; search?: string }) {
    const where: any = {};
    if (query?.status) {
      where.status = query.status;
    }
    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        place: {
          include: { zones: true },
        },
        eventZones: {
          include: {
            zone: true,
            _count: { select: { tickets: true } },
          },
        },
        schedules: {
          orderBy: { startTime: "asc" },
        },
        organizer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: { id: "asc" },
    });

    return events.map((e) => this.serializeEvent(e));
  }

  /**
   * Lấy chi tiết 1 sự kiện theo ID
   */
  static async getEventById(id: number) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        place: {
          include: { zones: true },
        },
        eventZones: {
          include: {
            zone: true,
            _count: { select: { tickets: true } },
          },
        },
        schedules: {
          orderBy: { startTime: "asc" },
        },
        organizer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { tickets: true },
        },
      },
    });

    if (!event) return null;
    return this.serializeEvent(event);
  }

  /**
   * Seed/Khởi tạo các sự kiện mặc định nếu DB chưa có đầy đủ
   */
  static async seedEventsIfMissing() {
    // Kiểm tra xem đã có event 99 (Test PayOS) chưa
    const testEvent = await prisma.event.findUnique({ where: { id: 99 } });
    if (testEvent) return;

    // Tìm hoặc tạo admin user
    let organizer = await prisma.user.findFirst({
      where: { email: "admin@ticket.local" },
    });
    if (!organizer) {
      organizer = await prisma.user.findFirst();
    }
    if (!organizer) return;

    // Tìm hoặc tạo Place
    let place = await prisma.place.findFirst({
      where: { name: "Sân vận động Quốc gia Mỹ Đình" },
    });
    if (!place) {
      place = await prisma.place.create({
        data: {
          name: "Sân vận động Quốc gia Mỹ Đình",
          address: "Đường Lê Đức Thọ, Phường Mỹ Đình 1, Nam Từ Liêm",
          city: "Hà Nội",
        },
      });
    }

    // Tạo Zone
    let zone = await prisma.zone.findFirst({
      where: { placeId: place.id, name: "Khu vực Khảo sát / Test" },
    });
    if (!zone) {
      zone = await prisma.zone.create({
        data: {
          placeId: place.id,
          name: "Khu vực Khảo sát / Test",
          hasSeats: true,
        },
      });
    }

    // Tạo event 99
    await prisma.event.upsert({
      where: { id: 99 },
      update: {},
      create: {
        id: 99,
        organizerId: organizer.id,
        placeId: place.id,
        title: "🧪 Vé Thử Nghiệm Thanh Toán PayOS (VietQR 2.000đ)",
        description:
          "Sự kiện mẫu thử nghiệm quy trình thanh toán trực tuyến qua cổng VietQR PayOS thật. Giá vé: 2.000đ để test quét mã ngân hàng.",
        bannerUrl:
          "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1600&q=80",
        status: "active",
        eventZones: {
          create: [
            {
              zoneId: zone.id,
              price: 2000,
              totalSeats: 999,
            },
          ],
        },
        schedules: {
          create: [
            {
              startTime: new Date(Date.now() + 86400000 * 30),
              endTime: new Date(Date.now() + 86400000 * 30 + 14400000),
              status: "open",
            },
          ],
        },
      },
    });
  }
}
