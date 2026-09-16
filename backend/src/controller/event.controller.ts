import type { Request, Response } from "express";
import { EventService } from "../service/event.service.js";

/**
 * Lấy danh sách sự kiện từ DB
 * GET /api/v1/events
 */
export const listEvents = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    const query: { status?: string; search?: string } = {};
    if (typeof status === "string") query.status = status;
    if (typeof search === "string") query.search = search;

    const events = await EventService.listEvents(query);

    return res.status(200).json({
      success: true,
      data: { events },
    });
  } catch (error: any) {
    console.error("listEvents controller error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Lỗi khi lấy danh sách sự kiện từ cơ sở dữ liệu",
    });
  }
};

/**
 * Lấy thông tin chi tiết sự kiện theo ID
 * GET /api/v1/events/:id
 */
export const getEventById = async (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        message: "ID sự kiện không hợp lệ",
      });
    }

    const event = await EventService.getEventById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sự kiện",
      });
    }

    return res.status(200).json({
      success: true,
      data: { event },
    });
  } catch (error: any) {
    console.error("getEventById controller error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Lỗi khi lấy thông tin sự kiện",
    });
  }
};

/**
 * Khởi tạo dữ liệu mẫu nếu thiếu
 * POST /api/v1/events/seed
 */
export const seedEvents = async (_req: Request, res: Response) => {
  try {
    await EventService.seedEventsIfMissing();
    return res.status(200).json({
      success: true,
      message: "Đã kiểm tra và cập nhật dữ liệu sự kiện mẫu",
    });
  } catch (error: any) {
    console.error("seedEvents controller error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Lỗi khởi tạo dữ liệu sự kiện",
    });
  }
};
