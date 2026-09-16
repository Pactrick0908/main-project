import { getToken } from "./auth.api";
import type { TicketDto } from "./ticket.api";

const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

export type AdminEventZone = {
  id: number;
  name: string;
  zoneId: number;
  hasSeats: boolean;
  price: number;
  totalSeats: number;
  soldTickets: number;
};

export type AdminEvent = {
  id: number;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  status: string;
  ticketId: string | null;
  createdAt: string;
  place: { id: number; name: string; address: string; city: string };
  schedules: Array<{
    id: number;
    startTime: string;
    endTime: string;
    status: string | null;
  }>;
  zones: AdminEventZone[];
  soldTickets: number;
};

export type DashboardStats = {
  soldTickets: number;
  checkedIn: number;
  revoked: number;
  checkInRate: number;
  eventsActive: number;
  eventsTotal: number;
  revenue: number;
  systemRevenue: number;
  paidOrders: number;
  orderRevenue: number;
  recentTickets: Array<{
    id: number;
    status: string | null;
    ownerWallet: string | null;
    checkedInAt: string | null;
    isCheckedIn: boolean;
    event: { id: number; title: string };
    zoneName: string;
    price: number;
    ownerName: string | null;
    ownerEmail: string | null;
  }>;
};

async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(body.message || "Request failed"), {
      status: res.status,
      code: body.code,
    });
  }
  return body as T;
}

export const adminApi = {
  dashboard: () =>
    api<{ success: boolean; data: DashboardStats }>("/admin/dashboard"),

  listTickets: (q?: string) =>
    api<{ success: boolean; data: { tickets: TicketDto[] } }>(
      `/admin/tickets${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    ),

  checkIn: (ticketId: number) =>
    api<{ success: boolean; data: { ticket: TicketDto } }>(
      `/admin/tickets/${ticketId}/check-in`,
      { method: "POST" },
    ),

  revoke: (ticketId: number, reason?: string) =>
    api<{ success: boolean; data: { id: number; status: string } }>(
      `/admin/tickets/${ticketId}/revoke`,
      { method: "POST", body: JSON.stringify({ reason }) },
    ),

  airdrop: (payload: {
    eventId: number;
    eventZoneId: number;
    email?: string;
    walletAddress?: string;
  }) =>
    api<{ success: boolean; data: { ticket: TicketDto } }>("/admin/airdrop", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listEvents: () =>
    api<{ success: boolean; data: { events: AdminEvent[] } }>("/events"),

  createEvent: (payload: {
    title: string;
    description?: string;
    bannerUrl?: string;
    status?: string;
    placeId?: number;
    place?: { name: string; address: string; city: string };
    startTime?: string;
    endTime?: string;
    zones: Array<{
      zoneId?: number;
      name: string;
      price: number;
      totalSeats: number;
      hasSeats?: boolean;
      rowCount?: number;
      generateSeats?: boolean;
    }>;
  }) =>
    api<{ success: boolean; data: { event: AdminEvent } }>("/events", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listPlaces: () =>
    api<{
      success: boolean;
      data: {
        places: Array<{
          id: number;
          name: string;
          address: string;
          city: string;
          zones: Array<{
            id: number;
            name: string;
            hasSeats: boolean;
            _count: { seats: number };
          }>;
        }>;
      };
    }>("/events/places"),

  updateEvent: (
    id: number,
    payload: Partial<{
      title: string;
      description: string;
      bannerUrl: string;
      status: string;
    }>,
  ) =>
    api<{ success: boolean; data: { event: AdminEvent } }>(`/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteEvent: (id: number) =>
    api<{ success: boolean }>(`/events/${id}`, { method: "DELETE" }),
};
