import type { GoogleJwtPayload } from "../controller/auth.controller.js";
import { prisma } from "../lib/prisma.js";
import { generateToken } from "../utils/jwt.js";
import { WalletService } from "./wallet.service.js";
import { permissionsForRole } from "../constants/permissions.js";
import { RbacService } from "./rbac.service.js";

export class AuthService {
  /** Đảm bảo role tồn tại và trả về id */
  private static async getDefaultRoleId(
    roleName = "customer",
  ): Promise<number | null> {
    try {
      await RbacService.ensureSystemRoles();
      return await RbacService.getRoleId(roleName);
    } catch (e) {
      console.warn("Không thể kiểm tra/tạo Role trong DB:", e);
      return null;
    }
  }

  private static buildSession(user: {
    id: number;
    googleId: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    walletAddress: string;
    role?: { name: string } | null;
  }) {
    const roleName = user.role?.name ?? "customer";
    const permissions = permissionsForRole(roleName);

    return (async () => {
      const token = await generateToken({
        googleId: user.googleId,
        email: user.email,
        walletAddress: user.walletAddress,
        role: roleName,
        userId: user.id,
        permissions,
      });

      return {
        token,
        user: {
          id: user.id,
          googleId: user.googleId,
          name: user.fullName,
          email: user.email,
          avatar: user.avatarUrl ?? "",
          walletAddress: user.walletAddress,
          role: roleName,
          permissions,
        },
      };
    })();
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

    // Giữ nguyên role đã được admin gán; user mới → customer
    const defaultRoleId =
      existing?.roleId ?? (await this.getDefaultRoleId("customer"));

    const userData = {
      fullName: userInfo.name || "Người dùng Solana",
      email: userInfo.email,
      avatarUrl: userInfo.picture ?? "",
      walletAddress,
      ...(defaultRoleId && !existing ? { roleId: defaultRoleId } : {}),
    };

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            fullName: userData.fullName,
            email: userData.email,
            avatarUrl: userData.avatarUrl,
            walletAddress: userData.walletAddress,
          },
          include: { role: true },
        })
      : await prisma.user.create({
          data: {
            googleId: userInfo.sub,
            ...userData,
          },
          include: { role: true },
        });

    return this.buildSession(user);
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

  /** Đăng nhập admin demo — tự gắn role admin. */
  static async loginAdminDemo() {
    await RbacService.ensureSystemRoles();
    const adminRoleId = await this.getDefaultRoleId("admin");

    if (!adminRoleId) {
      throw new Error("Không tạo được role admin");
    }

    const wallet = WalletService.createWalletFromGoogle("demo-admin");
    const walletAddress = wallet.publicKey.toBase58();

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: "demo-admin" }, { email: "admin@ticket.local" }],
      },
    });

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            fullName: "Admin Ticket3",
            email: "admin@ticket.local",
            walletAddress,
            avatarUrl: "",
            roleId: adminRoleId,
          },
          include: { role: true },
        })
      : await prisma.user.create({
          data: {
            googleId: "demo-admin",
            fullName: "Admin Ticket3",
            email: "admin@ticket.local",
            walletAddress,
            avatarUrl: "",
            roleId: adminRoleId,
          },
          include: { role: true },
        });

    return this.buildSession(user);
  }
}
