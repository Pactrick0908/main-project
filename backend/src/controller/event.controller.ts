import type { Request, Response } from "express";
import { EventService } from "../service/event.service.js";

export const listEvents = async (_req: Request, res: Response) => {
  try {
    const events = await EventService.list();
    return res.json({ success: true, data: { events } });
  } catch (error) {
    console.error("listEvents:", error);
    return res.status(500).json({ success: false, message: "Lỗi tải sự kiện" });
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
    const organizerId = req.auth?.userId;
    if (!organizerId) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
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
