import type { Request, Response } from "express";
import { EventService } from "../service/event.service.js";
import { CatalogService } from "../service/catalog.service.js";

export const listEvents = async (req: Request, res: Response) => {
  try {
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const featuredRaw = req.query.featured;
    const featuredOnly =
      featuredRaw === "1" ||
      featuredRaw === "true" ||
      featuredRaw === "yes";
    const events = await EventService.list(status, featuredOnly);
    return res.json({ success: true, data: { events } });
  } catch (error) {
    console.error("listEvents:", error);
    return res.status(500).json({ success: false, message: "Lỗi tải sự kiện" });
  }
};

export const searchCatalog = async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const data = await EventService.search(q);
    return res.json({ success: true, data });
  } catch (error) {
    console.error("searchCatalog:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi tìm kiếm",
    });
  }
};

export const getEvent = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const event = await EventService.getById(id);
    return res.json({ success: true, data: { event } });
  } catch (error: any) {
    return res
      .status(error?.status ?? 500)
      .json({ success: false, message: error?.message ?? "Lỗi" });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const auth = req.auth;
    if (!auth) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    // Ưu tiên nhà cung cấp được chọn trên form; fallback JWT user
    let organizerId: number | null = null;
    const requestedOrgId = Number(req.body?.organizerId);
    if (Number.isInteger(requestedOrgId) && requestedOrgId > 0) {
      const org = await CatalogService.getOrganizerById(requestedOrgId);
      if (!org) {
        return res.status(400).json({
          success: false,
          message: `Nhà cung cấp #${requestedOrgId} không tồn tại`,
        });
      }
      organizerId = org.id;
      if (!req.body.organizerName) {
        req.body.organizerName = org.fullName;
      }
      if (!req.body.logoUrl && org.avatarUrl) {
        req.body.logoUrl = org.avatarUrl;
      }
    } else {
      organizerId = await EventService.resolveOrganizerId({
        userId: auth.userId,
        googleId: auth.googleId,
        email: auth.email,
        walletAddress: auth.walletAddress,
      });
    }

    const event = await EventService.create({
      ...req.body,
      organizerId,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo sự kiện thành công",
      data: { event },
    });
  } catch (error: any) {
    console.error("createEvent:", error);
    return res
      .status(error?.status ?? 500)
      .json({ success: false, message: error?.message ?? "Lỗi tạo sự kiện" });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const event = await EventService.update(id, req.body);
    return res.json({
      success: true,
      message: "Cập nhật sự kiện thành công",
      data: { event },
    });
  } catch (error: any) {
    return res
      .status(error?.status ?? 500)
      .json({ success: false, message: error?.message ?? "Lỗi cập nhật" });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await EventService.remove(id);
    return res.json({ success: true, message: "Đã xóa sự kiện" });
  } catch (error: any) {
    return res
      .status(error?.status ?? 500)
      .json({ success: false, message: error?.message ?? "Lỗi xóa sự kiện" });
  }
};

export const listPlaces = async (_req: Request, res: Response) => {
  try {
    const places = await EventService.listPlaces();
    return res.json({ success: true, data: { places } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi tải địa điểm" });
  }
};
