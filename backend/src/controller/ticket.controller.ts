import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { TicketService } from "../service/ticket.service.js";

async function resolveUser(req: Request) {
  if (!req.auth) return null;
  const or: Array<Record<string, unknown>> = [
    { googleId: req.auth.googleId },
  ];
  if (req.auth.userId) or.push({ id: req.auth.userId });
  if (req.auth.walletAddress) {
    or.push({ walletAddress: req.auth.walletAddress });
  }
  if (req.auth.email) or.push({ email: req.auth.email });

  return prisma.user.findFirst({ where: { OR: or } });
}

export const listMyTickets = async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    const walletAddress =
      req.auth?.walletAddress || user.walletAddress;

    const tickets = await TicketService.listMine(walletAddress, user.id);
    return res.json({
      success: true,
      data: {
        tickets,
        wallet: {
          address: walletAddress,
          syncedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("listMyTickets:", error);
    return res.status(500).json({ success: false, message: "Lỗi tải vé" });
  }
};

export const issueDemoTicket = async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    const ticket = await TicketService.issueDemoTicket({
      userId: user.id,
      googleId: user.googleId,
      email: user.email,
      fullName: user.fullName,
      walletAddress: user.walletAddress,
    });

    return res.status(201).json({
      success: true,
      message: "Đã cấp vé demo",
      data: { ticket },
    });
  } catch (error) {
    console.error("issueDemoTicket:", error);
    return res.status(500).json({ success: false, message: "Lỗi cấp vé demo" });
  }
};

export const issueTicketQr = async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    const ticketId = Number(req.params.id);
    if (!Number.isFinite(ticketId)) {
      return res.status(400).json({ success: false, message: "ticket id không hợp lệ" });
    }

    const result = await TicketService.issueQrPayload(ticketId, {
      walletAddress: user.walletAddress,
      googleId: user.googleId,
      userId: user.id,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const status = error?.status ?? 500;
    return res.status(status).json({
      success: false,
      message: error?.message ?? "Lỗi tạo mã QR",
    });
  }
};

export const verifyTicket = async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const payload =
      typeof body.payload === "object" && body.payload
        ? body.payload
        : body;

    const result = await TicketService.verifyQr(payload, req.auth?.email ?? "gate");

    if (!result.ok) {
      return res.status(400).json({
        success: false,
        code: result.code,
        message: result.message,
        data: { ticket: "ticket" in result ? result.ticket : undefined },
      });
    }

    return res.json({
      success: true,
      code: result.code,
      message: result.message,
      data: { ticket: result.ticket },
    });
  } catch (error) {
    console.error("verifyTicket:", error);
    return res.status(500).json({ success: false, message: "Lỗi xác thực vé" });
  }
};

export const listTicketsAdmin = async (_req: Request, res: Response) => {
  try {
    const tickets = await TicketService.listAllForAdmin();
    return res.json({ success: true, data: { tickets } });
  } catch (error) {
    console.error("listTicketsAdmin:", error);
    return res.status(500).json({ success: false, message: "Lỗi tải danh sách vé" });
  }
};
