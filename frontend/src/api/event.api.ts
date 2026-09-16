import { getToken } from "./auth.api";
import type { DetailedEvent, EventZone } from "@/data/events.data";

const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

export interface EventZoneDto extends EventZone {
  eventZoneId?: number;
  zoneId?: number;
  totalSeats?: number;
}

export interface EventDto extends DetailedEvent {
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  priceRange?: string;
  passCount?: number;
  zones: EventZoneDto[];
  organizerInfo?: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
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
   * Lấy danh sách sự kiện từ backend DB
   */
  listEvents: async (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
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
