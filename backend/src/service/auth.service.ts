import type { GoogleJwtPayload } from "../controller/auth.controller.js";
import { prisma } from "../lib/prisma.js";
import { generateToken } from "../utils/jwt.js";
import { WalletService } from "./wallet.service.js";

export class AuthService {
  /** Đảm bảo các role cơ bản tồn tại trong DB và trả về role mặc định */
  private static async getDefaultRoleId(roleName = "customer"): Promise<number | null> {
    try {
      let role = await prisma.role.findUnique({
        where: { name: roleName },
      });

      if (!role) {
        // Tự động tạo role nếu DB chưa có
        role = await prisma.role.create({
          data: {
            name: roleName,
            description: roleName === "admin" ? "Quản trị hệ thống" : "Khách mua vé",
          },
        });
      }
      return role.id;
    } catch (e) {
      console.warn("Không thể kiểm tra/tạo Role trong DB:", e);
      return null;
    }
  }

  static async login(userInfo: GoogleJwtPayload) {
    const wallet = WalletService.createWalletFromGoogle(userInfo.sub);
    if (!wallet) {
      throw new Error("Lỗi tạo ví");
    }
    const walletAddress = wallet.publicKey.toBase58();

    const existing = await prisma.user.findFirst({
      where: { googleId: userInfo.sub },
      include: { role: true },
    });

    const defaultRoleId = existing?.roleId ?? (await this.getDefaultRoleId("customer"));

    const userData = {
      fullName: userInfo.name || "Người dùng Solana",
      email: userInfo.email,
      avatarUrl: userInfo.picture ?? "",
      walletAddress,
      ...(defaultRoleId ? { roleId: defaultRoleId } : {}),
    };

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: userData,
          include: { role: true },
        })
      : await prisma.user.create({
          data: {
            googleId: userInfo.sub,
            ...userData,
          },
          include: { role: true },
        });

    const roleName = user.role?.name ?? "customer";

    const token = await generateToken({
      googleId: user.googleId,
      email: user.email,
      walletAddress: user.walletAddress,
      role: roleName,
      userId: user.id,
    });

    return {
      token,
      user: {
        id: user.id,
        googleId: user.googleId,
        name: user.fullName,
        email: user.email,
        avatar: user.avatarUrl,
        walletAddress: user.walletAddress,
        role: roleName,
      },
    };
  }

  /** Tài khoản thử nghiệm — không cần Google, để test Dynamic QR. */
  static async loginDemo() {
    return AuthService.login({
      sub: "demo-guest",
      email: "demo@ticket.local",
      email_verified: true,
      name: "Khách Demo",
      picture: "",
    });
  }
}
