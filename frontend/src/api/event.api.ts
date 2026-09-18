import { getToken } from "./auth.api";
import type { DetailedEvent, EventZone } from "@/data/events.data";

const API_BASE =
  import.meta.env.VITE_API_URL ?? "/api/v1";

export interface EventZoneDto extends EventZone {
  eventZoneId?: number;
  zoneId?: number;
  totalSeats?: number;
  /** Số hàng ghế (event_zones.row) — layout = total_seats / row */
  rowCount?: number;
  row?: number | null;
  /** Ghế đã có ticket.seatId — ẩn trên sơ đồ (vd ["A1","B3"]) */
  soldSeats?: string[];
  hasSeats?: boolean;
}

export interface EventDto extends DetailedEvent {
  status?: string;
  bannerUrl?: string | null;
  minPrice?: number;
  maxPrice?: number;
  priceRange?: string;
  passCount?: number;
  soldTickets?: number;
  schedules?: Array<{
    id: number;
    startTime: string;
    endTime: string;
    status?: string | null;
  }>;
  saleOpensAt?: string | null;
  place?: { id?: number; name: string; address?: string; city: string };
  zones: EventZoneDto[];
  artists?: Array<{
    id: number;
    name: string;
    stageName?: string | null;
    avatarUrl?: string | null;
    genre?: string | null;
    role?: string;
  }>;
  organizerInfo?: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
  isFeatured?: boolean;
  soldOut?: boolean;
  salesClosed?: boolean;
  salesOpen?: boolean;
  saleOpened?: boolean;
  ticketsAvailable?: boolean;
  saleOpensAt?: string | null;
  date?: string;
  priceRange?: string;
  category?: string;
  thumbnail?: string | null;
  venue?: string;
  location?: string;
  artist?: string;
}

async function api<T>(
  path: string,
  options: RequestInit = {},
  auth = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(body.message || "Request failed"), {
      status: res.status,
      code: body.code,
      data: body.data,
    });
  }
  return body as T;
}

export const eventApi = {
  /**
   * Tìm concert / nghệ sĩ (+ từ khóa nổi bật, sự kiện sắp diễn ra)
   */
  search: async (q?: string) => {
    const qs = q?.trim()
      ? `?q=${encodeURIComponent(q.trim())}`
      : "";
    return api<{
      success: boolean;
      data: {
        query: string;
        events: EventDto[];
        artists: Array<{
          id: number;
          name: string;
          stageName: string | null;
          avatarUrl: string | null;
          eventCount: number;
        }>;
        hotKeywords: string[];
        upcoming: EventDto[];
      };
    }>(`/events/search${qs}`, {}, false);
  },

  /**
   * Lấy danh sách sự kiện từ backend DB
   */
  listEvents: async (params?: {
    status?: string;
    search?: string;
    featured?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.featured) query.set("featured", "1");
    const qs = query.toString() ? `?${query.toString()}` : "";

    return api<{ success: boolean; data: { events: EventDto[] } }>(
      `/events${qs}`,
      {},
      false,
    );
  },

  /**
   * Lấy thông tin chi tiết sự kiện theo ID từ backend DB
   */
  getEventById: async (id: number | string) => {
    return api<{ success: boolean; data: { event: EventDto } }>(
      `/events/${id}`,
      {},
      false,
    );
  },

  /**
   * Khởi tạo dữ liệu mẫu nếu DB chưa có
   */
  seedEvents: async () => {
    return api<{ success: boolean; message: string }>(
      `/events/seed`,
      { method: "POST" },
      false,
    );
  },
};
