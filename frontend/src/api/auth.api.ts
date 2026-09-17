// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id?: number;
  googleId?: string;
  name: string;
  email: string;
  avatar: string;
  walletAddress: string;
  role?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export function isCustomerRole(role?: string | null): boolean {
  const normalized = (role ?? "").trim().toLowerCase();
  return normalized === "customer" || normalized === "khách hàng";
}

export type StaffRole = "admin" | "organizer" | "scanner";

export function getStaffRole(role?: string | null): StaffRole | null {
  const normalized = (role ?? "").trim().toLowerCase();
  if (normalized === "admin" || normalized === "super_admin") return "admin";
  if (normalized === "organizer" || normalized === "organizer_admin") {
    return "organizer";
  }
  if (normalized === "scanner" || normalized === "checkin_staff") {
    return "scanner";
  }
  return null;
}

export function organizerCanAccess(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/admin";
  if (path === "/admin") return true;
  return [
    "/admin/places",
    "/admin/artists",
    "/admin/events",
    "/admin/tickets",
    "/admin/airdrop",
  ].some((prefix) => path.startsWith(prefix));
}

// ─── Config ──────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const KEYS = {
  token: "slt_token",
  user: "slt_user",
} as const;

export function getToken(): string | null {
  return localStorage.getItem(KEYS.token);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: AuthUser): void {
  localStorage.setItem(KEYS.token, token);
  localStorage.setItem(KEYS.user, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(KEYS.token);
  localStorage.removeItem(KEYS.user);
}

/** Tắt auto-select Google để lần đăng nhập sau được chọn lại tài khoản. */
export function clearGoogleIdentity(email?: string | null): void {
  try {
    const g = (
      window as unknown as {
        google?: {
          accounts?: {
            id?: {
              disableAutoSelect?: () => void;
              revoke?: (hint: string, done: () => void) => void;
            };
          };
        };
      }
    ).google?.accounts?.id;
    g?.disableAutoSelect?.();
    if (email) {
      g?.revoke?.(email, () => {});
    }
  } catch {
    /* GIS chưa load — không chặn logout */
  }
}

// ─── API calls ───────────────────────────────────────────────────────────────

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }

  // Backend shape: { success, message, data: { token, user } }
  return json.data as T;
}

export const authApi = {
  /** Đăng nhập bằng Google ID Token */
  loginWithGoogle: (idToken: string) =>
    post<AuthSession>("/auth/login", { token: idToken }),

  /** Đăng nhập demo — không cần Google */
  loginDemo: () => post<AuthSession>("/auth/demo"),

  /** Đăng nhập admin demo */
  loginAdminDemo: () => post<AuthSession>("/auth/admin-demo"),
};
