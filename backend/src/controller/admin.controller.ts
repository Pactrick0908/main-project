import type { Request, Response } from "express";
import { AdminService } from "../service/admin.service.js";

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const role = (req.auth?.role ?? "").toLowerCase();
    const isOrganizer = role === "organizer";
    const rawEventId = Number(req.query.eventId);
    const eventId =
      Number.isInteger(rawEventId) && rawEventId > 0 ? rawEventId : undefined;
    const stats = await AdminService.getDashboard({
      organizerId:
        isOrganizer && req.auth?.userId ? req.auth.userId : undefined,
      eventId: isOrganizer ? undefined : eventId,
      includeWallet: role === "admin",
    });
    return res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("getDashboard:", error);
    return res
      .status(error?.status ?? 500)
      .json({ success: false, message: error?.message ?? "Lỗi tải dashboard" });
  }
};

export const listAdminTickets = async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const tickets = await AdminService.listTickets(q);
    return res.json({ success: true, data: { tickets } });
  } catch (error) {
    console.error("listAdminTickets:", error);
    return res.status(500).json({ success: false, message: "Lỗi tải vé" });
  }
};

export const manualCheckIn = async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const ticket = await AdminService.manualCheckIn(
      ticketId,
      req.auth?.email ?? "admin",
    );
    return res.json({
      success: true,
      message: "Check-in thủ công thành công",
      data: { ticket },
    });
  } catch (error: any) {
    return res
      .status(error?.status ?? 500)
      .json({ success: false, message: error?.message ?? "Lỗi check-in" });
  }
};

export const revokeTicket = async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const result = await AdminService.revokeTicket(
      ticketId,
      req.body?.reason,
    );
    return res.json({
      success: true,
      message: "Đã khóa vé",
      data: result,
    });
  } catch (error: any) {
    return res
      .status(error?.status ?? 500)
      .json({ success: false, message: error?.message ?? "Lỗi khóa vé" });
  }
};

export const airdropTicket = async (req: Request, res: Response) => {
  try {
    const organizerId = req.auth?.userId;
    if (!organizerId) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    const { eventId, eventZoneId, email, walletAddress } = req.body ?? {};
    if (!eventId || !eventZoneId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu eventId hoặc eventZoneId",
      });
    }

    const ticket = await AdminService.airdrop({
      eventId: Number(eventId),
      eventZoneId: Number(eventZoneId),
      email,
      walletAddress,
      organizerId,
    });

    return res.status(201).json({
      success: true,
      message: "Đã cấp vé mời",
      data: { ticket },
    });
  } catch (error: any) {
    return res
      .status(error?.status ?? 500)
      .json({ success: false, message: error?.message ?? "Lỗi airdrop" });
  }
};
