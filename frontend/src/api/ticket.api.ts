import { getToken } from "./auth.api";

const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

export type TicketDto = {
  id: number;
  status: string | null;
  ownerWallet: string | null;
  mintAddress: string | null;
  checkedInAt: string | null;
  isCheckedIn: boolean;
  event: { id: number; title: string; bannerUrl: string | null };
  zoneName: string;
  price: number;
  seatLabel: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
};

export type QrPayload = {
  ticketId: number;
  ownerPubkey: string;
  nonce: string;
  expiresAt: number;
  signature: string;
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

export const ticketApi = {
  listMine: () =>
    api<{ success: boolean; data: { tickets: TicketDto[] } }>("/tickets/mine"),

  issueDemo: () =>
    api<{ success: boolean; data: { ticket: TicketDto } }>("/tickets/demo", {
      method: "POST",
    }),

  issueQr: (ticketId: number) =>
    api<{
      success: boolean;
      data: { payload: QrPayload; ttlMs: number; ticket: TicketDto };
    }>(`/tickets/${ticketId}/qr`, { method: "POST" }),

  verify: (payload: QrPayload) =>
    api<{
      success: boolean;
      code: string;
      message: string;
      data: { ticket: TicketDto };
    }>(
      "/tickets/verify",
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "X-Scanner-Key":
            import.meta.env.VITE_SCANNER_KEY ?? "gate-demo",
        },
      },
      false,
    ),
};
