import { getToken } from "./auth.api";
import type { TicketDto } from "./ticket.api";

const API_BASE =
  import.meta.env.VITE_API_URL ?? "/api/v1";

export type AdminArtist = {
  id: number;
  name: string;
  stageName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  genre: string | null;
  createdAt?: string;
  eventCount?: number;
};

export type AdminOrganizer = {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  walletAddress: string;
  role: string;
  createdAt?: string;
};

export type AdminPlace = {
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
  _count?: { events: number };
};

export type AdminEventEditPolicy = {
  status: "draft" | "upcoming" | "open" | "ended";
  hasBookings: boolean;
  canEditAll: boolean;
  canEditMarketing: boolean;
  canEditSensitive: boolean;
  canChangePlace: boolean;
  canChangePrice: boolean;
  canModifyZones: boolean;
  canAddZone: boolean;
  canDeleteEvent: boolean;
  canChangeStatus: boolean;
  reason: string;
};

export type AdminEventZone = {
  id: number;
  name: string;
  zoneId: number;
  hasSeats: boolean;
  price: number;
  totalSeats: number;
  soldTickets: number;
  rowCount?: number;
  soldSeats?: string[];
};

export type AdminEvent = {
  id: number;
  title: string;
  description: string | null;
  organizerName?: string | null;
  organizerId?: number | null;
  organizer?: string;
  bannerUrl: string | null;
  mapUrl?: string | null;
  logoUrl?: string | null;
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
  editPolicy?: AdminEventEditPolicy;
  artists?: Array<{
    id: number;
    name: string;
    stageName: string | null;
    avatarUrl: string | null;
    genre: string | null;
    role?: string;
  }>;
  artist?: string;
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
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
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
  uploadImage: (
    file: File,
    folder: "artists" | "organizers" | "events" | "maps" | "misc" = "misc",
  ) => {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    return api<{
      success: boolean;
      data: {
        url: string;
        publicId: string;
        width?: number;
        height?: number;
        format?: string;
        bytes?: number;
      };
    }>("/admin/upload", { method: "POST", body: form });
  },

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

  listPlaces: () =>
    api<{ success: boolean; data: { places: AdminPlace[] } }>(
      "/admin/places",
    ),

  createPlace: (payload: {
    name: string;
    address?: string;
    city?: string;
    zones?: Array<{ name: string; hasSeats?: boolean }>;
  }) =>
    api<{ success: boolean; data: { place: AdminPlace } }>("/admin/places", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updatePlace: (
    id: number,
    payload: {
      name?: string;
      address?: string;
      city?: string;
      zones?: Array<{ id?: number; name: string; hasSeats?: boolean }>;
    },
  ) =>
    api<{ success: boolean; data: { place: AdminPlace } }>(
      `/admin/places/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),

  deletePlace: (id: number) =>
    api<{ success: boolean; data: { id: number } }>(`/admin/places/${id}`, {
      method: "DELETE",
    }),

  listOrganizers: () =>
    api<{ success: boolean; data: { organizers: AdminOrganizer[] } }>(
      "/admin/organizers",
    ),

  createOrganizer: (payload: {
    fullName: string;
    email: string;
    avatarUrl?: string;
  }) =>
    api<{ success: boolean; data: { organizer: AdminOrganizer } }>(
      "/admin/organizers",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  updateOrganizer: (
    id: number,
    payload: {
      fullName?: string;
      email?: string;
      avatarUrl?: string;
    },
  ) =>
    api<{ success: boolean; data: { organizer: AdminOrganizer } }>(
      `/admin/organizers/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),

  deleteOrganizer: (id: number) =>
    api<{ success: boolean; data: { id: number } }>(
      `/admin/organizers/${id}`,
      { method: "DELETE" },
    ),

  listArtists: (q?: string) =>
    api<{ success: boolean; data: { artists: AdminArtist[] } }>(
      `/admin/artists${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    ),

  createArtist: (payload: {
    name: string;
    stageName?: string;
    bio?: string;
    avatarUrl?: string;
    genre?: string;
  }) =>
    api<{ success: boolean; data: { artist: AdminArtist } }>(
      "/admin/artists",
      { method: "POST", body: JSON.stringify(payload) },
    ),

  updateArtist: (
    id: number,
    payload: {
      name?: string;
      stageName?: string;
      bio?: string;
      avatarUrl?: string | null;
      genre?: string;
    },
  ) =>
    api<{ success: boolean; data: { artist: AdminArtist } }>(
      `/admin/artists/${id}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    ),

  deleteArtist: (id: number) =>
    api<{ success: boolean; data: { id: number } }>(`/admin/artists/${id}`, {
      method: "DELETE",
    }),

  createEvent: (payload: {
    title: string;
    description?: string;
    organizerId?: number;
    organizerName?: string;
    bannerUrl?: string;
    mapUrl?: string;
    logoUrl?: string;
    status?: string;
    placeId?: number;
    place?: { name: string; address: string; city: string };
    startTime?: string;
    endTime?: string;
    artistIds?: number[];
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

  updateEvent: (
    id: number,
    payload: Partial<{
      title: string;
      description: string;
      organizerName: string;
      bannerUrl: string;
      mapUrl: string;
      logoUrl: string;
      status: string;
    }>,
  ) =>
    api<{ success: boolean; data: { event: AdminEvent } }>(`/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteEvent: (id: number) =>
    api<{ success: boolean }>(`/events/${id}`, { method: "DELETE" }),

  rbacCatalog: () =>
    api<{ success: boolean; data: RbacCatalog }>("/admin/rbac/catalog"),

  assignRole: (payload: {
    userId: number;
    roleId: number;
    scopeType: RbacScopeType;
    scopeId?: number;
  }) =>
    api<{ success: boolean; data: { assignment: unknown } }>(
      "/admin/roles/assign",
      { method: "POST", body: JSON.stringify(payload) },
    ),

  revokeRole: (payload: {
    userId: number;
    roleId: number;
    scopeType: RbacScopeType;
    scopeId?: number;
  }) =>
    api<{ success: boolean; data: { revoked: boolean; id: number } }>(
      "/admin/roles/revoke",
      { method: "POST", body: JSON.stringify(payload) },
    ),
};

export type RbacScopeType = "GLOBAL" | "ORGANIZER" | "EVENT";

export type RbacCatalog = {
  roles: Array<{
    id: number;
    name: string;
    code: string;
    label: string;
    description: string | null;
    assignable: boolean;
    globalOnly: boolean;
    eventOnly: boolean;
  }>;
  users: Array<{
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    legacyRole: string | null;
  }>;
  events: Array<{
    id: number;
    title: string;
    organizerId: number | null;
    organizerName: string | null;
    status: string | null;
  }>;
  organizers: Array<{ id: number; fullName: string; email: string }>;
  assignments: Array<{
    id: number;
    userId: number;
    roleId: number;
    role: string;
    roleLabel: string;
    scopeType: RbacScopeType;
    scopeId: number;
    createdAt: string;
    user: { id: number; fullName: string; email: string };
    event: { id: number; title: string } | null;
    organizer: { id: number; fullName: string; email: string } | null;
  }>;
};
