import { getToken } from "./auth.api";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

export type MarketplaceListingDto = {
  id: number;
  listingId: number;
  ticketId: number;
  eventId: number;
  title: string;
  category: string;
  artist: string;
  image: string;
  date: string;
  location: string;
  seatZone: string;
  zoneName?: string;
  seatLabel?: string | null;
  seller: string;
  sellerId: number;
  sellerAvatar?: string;
  sellerNote: string;
  originalPrice: string;
  passPrice: string;
  passPriceNumber: number;
  facePriceNumber: number;
  mintAddress?: string | null;
  verified: boolean;
  status: string;
  createdAt?: string;
  createdAtIso?: string;
};

export type P2PTradeCreateResult = {
  tradeId: number;
  payosOrderCode: number;
  listingId: number;
  ticketId: number;
  amount: number;
  escrowStatus: string;
  expiresAt: string;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  eventTitle: string;
  sellerName: string;
};

async function api<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
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

export const marketplaceApi = {
  listListings: (params?: { eventId?: number; q?: string }) => {
    const qs = new URLSearchParams();
    if (params?.eventId) qs.set("eventId", String(params.eventId));
    if (params?.q) qs.set("q", params.q);
    const q = qs.toString();
    return api<{ success: boolean; data: { listings: MarketplaceListingDto[] } }>(
      `/marketplace/listings${q ? `?${q}` : ""}`,
      {},
      false,
    );
  },

  createListing: (body: {
    ticketId: number;
    price: number;
    bankCode: string;
    bankName: string;
    bankAccountNo: string;
    bankAccountName: string;
    note?: string;
  }) =>
    api<{ success: boolean; data: { listing: MarketplaceListingDto } }>(
      "/marketplace/listings",
      { method: "POST", body: JSON.stringify(body) },
    ),

  cancelListing: (id: number) =>
    api<{ success: boolean; data: { id: number; status: string } }>(
      `/marketplace/listings/${id}`,
      { method: "DELETE" },
    ),

  createTrade: (listingId: number) =>
    api<{ success: boolean; data: P2PTradeCreateResult }>(
      "/marketplace/trades",
      { method: "POST", body: JSON.stringify({ listingId }) },
    ),

  getTrade: (id: number) =>
    api<{
      success: boolean;
      data: {
        trade: {
          id: number;
          escrowStatus: string;
          ticketId: number;
          amount: number;
        };
      };
    }>(`/marketplace/trades/${id}`),

  getTradeByCode: (code: number) =>
    api<{
      success: boolean;
      data: { trade: { id: number; escrowStatus: string; ticketId: number } };
    }>(`/marketplace/trades/by-code/${code}`, {}, false),

  myListings: () =>
    api<{ success: boolean; data: { listings: MarketplaceListingDto[] } }>(
      "/marketplace/me/listings",
    ),

  myTrades: () =>
    api<{
      success: boolean;
      data: {
        trades: Array<{
          id: number;
          role: string;
          escrowStatus: string;
          eventTitle: string;
          amount: number;
        }>;
      };
    }>("/marketplace/me/trades"),
};
