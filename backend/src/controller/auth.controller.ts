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

export const login = async (req: Request, res: Response) => {
  const idToken = req.body.token;
  if (!idToken) return res.status(401).json({ message: "Chưa đăng nhập" });

  const userInfo = jwtDecode<GoogleJwtPayload>(idToken);

  try {
    const result = await AuthService.login(userInfo);

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      data: result,
    });
  } catch (error: any) {
    console.error("Login Error: ", error);
    return res.status(500).json({
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
