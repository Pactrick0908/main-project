export interface AuthUser {
  id?: number;
  googleId: string;
  name: string;
  email: string;
  avatar: string;
  walletAddress: string;
  role?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: AuthUser) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export const authApi = {
  loginWithGoogle: async (credential: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: credential }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.message || "Đăng nhập thất bại");
    }

    return body.data;
  },

  loginDemo: async (): Promise<LoginResponse["data"]> => {
    const res = await fetch(`${API_BASE}/auth/demo`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.message || "Đăng nhập demo thất bại");
    }
    return body.data;
  },
};
