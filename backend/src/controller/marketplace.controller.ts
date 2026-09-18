import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { MarketplaceService } from "../service/marketplace.service.js";
import { RefundService } from "../service/refund.service.js";

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

function httpError(res: Response, error: any, fallback: string) {
  const status = error?.status || 500;
  return res.status(status).json({
    success: false,
    message: error?.message || fallback,
    code: error?.code,
  });
}

export const listListings = async (req: Request, res: Response) => {
  try {
    await MarketplaceService.expirePendingTrades().catch(() => undefined);
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const listings = await MarketplaceService.listActive({
      eventId: Number.isFinite(eventId) ? eventId : undefined,
      q,
    });
    return res.json({ success: true, data: { listings } });
  } catch (error) {
    console.error("listListings:", error);
    return httpError(res, error, "Lỗi tải chợ vé");
  }
};

export const getListing = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const listing = await MarketplaceService.getListing(id);
    return res.json({ success: true, data: { listing } });
  } catch (error) {
    return httpError(res, error, "Lỗi tải listing");
  }
};

export const createListing = async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    const listing = await MarketplaceService.createListing({
      sellerId: user.id,
      ticketId: Number(req.body.ticketId),
      price: Number(req.body.price),
      bankCode: String(req.body.bankCode || ""),
      bankName: String(req.body.bankName || ""),
      bankAccountNo: String(req.body.bankAccountNo || ""),
      bankAccountName: String(req.body.bankAccountName || ""),
      ...(req.body.note ? { note: String(req.body.note) } : {}),
    });

    return res.status(201).json({
      success: true,
      message: "Đã niêm yết vé lên chợ P2P",
      data: { listing },
    });
  } catch (error) {
    console.error("createListing:", error);
    return httpError(res, error, "Lỗi đăng bán");
  }
};

export const cancelListing = async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }
    const result = await MarketplaceService.cancelListing(
      Number(req.params.id),
      user.id,
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    return httpError(res, error, "Lỗi hủy listing");
  }
};

export const createTrade = async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    const trade = await MarketplaceService.createTrade({
      buyerId: user.id,
      listingId: Number(req.body.listingId),
    });

    return res.status(201).json({
      success: true,
      message: "Tạo giao dịch P2P — thanh toán ký quỹ",
      data: trade,
    });
  } catch (error) {
    console.error("createTrade:", error);
    return httpError(res, error, "Lỗi tạo giao dịch P2P");
  }
};

export const getTrade = async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    const trade = await MarketplaceService.getTrade(
      Number(req.params.id),
      user?.id,
    );
    return res.json({ success: true, data: { trade } });
  } catch (error) {
    return httpError(res, error, "Lỗi tải trade");
  }
};

export const getTradeByCode = async (req: Request, res: Response) => {
  try {
    const code = Number(req.params.code);
    const trade = await MarketplaceService.getTradeByPayosCode(code);
    if (!trade) {
      return res.status(404).json({ success: false, message: "Không tìm thấy" });
    }
    return res.json({ success: true, data: { trade } });
  } catch (error) {
    return httpError(res, error, "Lỗi tải trade");
  }
};

export const myListings = async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }
    const listings = await MarketplaceService.myListings(user.id);
    return res.json({ success: true, data: { listings } });
  } catch (error) {
    return httpError(res, error, "Lỗi tải listings");
  }
};

export const myTrades = async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }
    const trades = await MarketplaceService.myTrades(user.id);
    return res.json({ success: true, data: { trades } });
  } catch (error) {
    return httpError(res, error, "Lỗi tải trades");
  }
};

/** Admin: hủy sự kiện + settlement chống double-pay */
export const settleEventCancel = async (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.eventId);
    const result = await MarketplaceService.settleEventCancellation(eventId);
    return res.json({ success: true, data: result });
  } catch (error) {
    return httpError(res, error, "Lỗi settle hủy sự kiện");
  }
};

/** Admin: giải ngân no-show sau ended */
export const releaseAfterEnded = async (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.eventId);
    const result = await MarketplaceService.releaseHeldAfterEventEnded(eventId);
    return res.json({ success: true, data: result });
  } catch (error) {
    return httpError(res, error, "Lỗi giải ngân sau ended");
  }
};

export const releaseEscrowManual = async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.ticketId);
    const result = await MarketplaceService.releaseEscrow(ticketId, "manual");
    return res.json({ success: true, data: result });
  } catch (error) {
    return httpError(res, error, "Lỗi giải ngân thủ công");
  }
};

export const refundEscrowManual = async (req: Request, res: Response) => {
  try {
    const ticketId = Number(req.params.ticketId);
    const result = await MarketplaceService.refundEscrow(
      ticketId,
      String(req.body?.reason || "manual_refund"),
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    return httpError(res, error, "Lỗi hoàn escrow");
  }
};

export const checkPrimaryRefundEligibility = async (
  req: Request,
  res: Response,
) => {
  try {
    const ticketId = Number(req.params.ticketId);
    const result = await RefundService.eligiblePrimaryRefund(ticketId);
    return res.json({ success: true, data: result });
  } catch (error) {
    return httpError(res, error, "Lỗi kiểm tra hoàn sơ cấp");
  }
};
