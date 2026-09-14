import type { GoogleJwtPayload } from "../controller/auth.controller.js";
import { prisma } from "../lib/prisma.js";
import { generateToken } from "../utils/jwt.js";
import { WalletService } from "./wallet.service.js";

export class AuthService {
  static async login(userInfo: GoogleJwtPayload) {
    const wallet = WalletService.createWalletFromGoogle(userInfo.sub);
    if (!wallet) {
      throw new Error("Lỗi tạo ví");
    }
    const walletAddress = wallet.publicKey.toBase58();

    const userData = {
      fullName: userInfo.name,
      email: userInfo.email,
      avatarUrl: userInfo.picture ?? "",
      walletAddress,
    };

    const existing = await prisma.user.findFirst({
      where: { googleId: userInfo.sub },
    });

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: userData,
        })
      : await prisma.user.create({
          data: {
            googleId: userInfo.sub,
            ...userData,
          },
        });

    const token = await generateToken({
      googleId: user.googleId,
      email: user.email,
      walletAddress: user.walletAddress,
    });

    return {
      token,
      user: {
        googleId: user.googleId,
        name: user.fullName,
        email: user.email,
        avatar: user.avatarUrl,
        walletAddress: user.walletAddress,
      },
    };
  }
}
