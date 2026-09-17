import type { Request, Response } from "express";
import { AuthService } from "../service/auth.service.js";
import { jwtDecode } from "jwt-decode";

export interface GoogleJwtPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
}

async function resolveGoogleUser(token: string): Promise<GoogleJwtPayload> {
  if (token.split(".").length === 3) {
    const decoded = jwtDecode<GoogleJwtPayload>(token);
    if (decoded?.sub && decoded?.email) return decoded;
  }

  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw Object.assign(new Error("Token Google không hợp lệ"), { status: 401 });
  }
  const profile = (await res.json()) as Partial<GoogleJwtPayload>;
  if (!profile.sub || !profile.email) {
    throw Object.assign(new Error("Không đọc được tài khoản Google"), {
      status: 401,
    });
  }
  return {
    sub: profile.sub,
    email: profile.email,
    email_verified: Boolean(profile.email_verified),
    name: profile.name || profile.email,
    picture: profile.picture || "",
  };
}

export const login = async (req: Request, res: Response) => {
  const token = req.body.token;
  if (!token || typeof token !== "string") {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  try {
    const userInfo = await resolveGoogleUser(token);
    const result = await AuthService.login(userInfo);

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      data: result,
    });
  } catch (error: any) {
    console.error("Login Error: ", error);
    return res.status(error?.status ?? 500).json({
      success: false,
      message: error?.message || "Lỗi Server khi đăng nhập (Kiểm tra kết nối Database)",
    });
  }
};

export const loginDemo = async (_req: Request, res: Response) => {
  try {
    const result = await AuthService.loginDemo();
    return res.status(200).json({
      success: true,
      message: "Đăng nhập demo thành công!",
      data: result,
    });
  } catch (error: any) {
    console.error("Demo login error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message ?? "Không đăng nhập demo được. Kiểm tra kết nối database.",
    });
  }
};

export const loginAdminDemo = async (_req: Request, res: Response) => {
  try {
    const result = await AuthService.loginAdminDemo();
    return res.status(200).json({
      success: true,
      message: "Đăng nhập admin demo thành công!",
      data: result,
    });
  } catch (error: any) {
    console.error("Admin demo login error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message ?? "Không đăng nhập admin được",
    });
  }
};
