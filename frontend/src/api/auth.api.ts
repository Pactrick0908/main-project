export interface LoginResponse {
  token: string;
  user: {
    googleId: string;
    name: string;
    email: string;
    avatar: string;
    walletAddress: string;
  };
}

const BACKEND_URL = "http://localhost:5000/api/v1";

export const authApi = {
  loginWithGoogle: async (credential: string): Promise<LoginResponse> => {
    const res = await fetch(`${BACKEND_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: credential }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Đăng nhập thất bại");
    }

    return res.json();
  },
};
