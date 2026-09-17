import type { Request, Response } from "express";
import { CatalogService } from "../service/catalog.service.js";

export const listPlacesAdmin = async (_req: Request, res: Response) => {
  try {
    const places = await CatalogService.listPlaces();
    return res.json({ success: true, data: { places } });
  } catch (error: any) {
    console.error("listPlacesAdmin:", error);
    return res
      .status(500)
      .json({ success: false, message: error?.message ?? "Lỗi tải địa điểm" });
  }
};

export const createPlace = async (req: Request, res: Response) => {
  try {
    const place = await CatalogService.createPlace(req.body ?? {});
    return res.status(201).json({
      success: true,
      message: "Đã tạo địa điểm",
      data: { place },
    });
  } catch (error: any) {
    console.error("createPlace:", error);
    return res
      .status(error?.status ?? 500)
      .json({ success: false, message: error?.message ?? "Lỗi tạo địa điểm" });
  }
};

export const deletePlace = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    }
    const result = await CatalogService.deletePlace(id);
    return res.json({
      success: true,
      message: "Đã xóa địa điểm",
      data: result,
    });
  } catch (error: any) {
    console.error("deletePlace:", error);
    return res
      .status(error?.status ?? 500)
      .json({ success: false, message: error?.message ?? "Lỗi xóa địa điểm" });
  }
};

export const updatePlace = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    }
    const place = await CatalogService.updatePlace(id, req.body ?? {});
    return res.json({
      success: true,
      message: "Đã cập nhật địa điểm",
      data: { place },
    });
  } catch (error: any) {
    console.error("updatePlace:", error);
    return res
      .status(error?.status ?? 500)
      .json({
        success: false,
        message: error?.message ?? "Lỗi cập nhật địa điểm",
      });
  }
};

export const listOrganizers = async (_req: Request, res: Response) => {
  try {
    const organizers = await CatalogService.listOrganizers();
    return res.json({ success: true, data: { organizers } });
  } catch (error: any) {
    console.error("listOrganizers:", error);
    return res.status(500).json({
      success: false,
      message: error?.message ?? "Lỗi tải nhà cung cấp",
    });
  }
};

export const createOrganizer = async (req: Request, res: Response) => {
  try {
    const organizer = await CatalogService.createOrganizer(req.body ?? {});
    return res.status(201).json({
      success: true,
      message: "Đã tạo nhà cung cấp",
      data: { organizer },
    });
  } catch (error: any) {
    console.error("createOrganizer:", error);
    return res.status(error?.status ?? 500).json({
      success: false,
      message: error?.message ?? "Lỗi tạo nhà cung cấp",
    });
  }
};

export const updateOrganizer = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    }
    const organizer = await CatalogService.updateOrganizer(id, req.body ?? {});
    return res.json({
      success: true,
      message: "Đã cập nhật nhà cung cấp",
      data: { organizer },
    });
  } catch (error: any) {
    console.error("updateOrganizer:", error);
    return res.status(error?.status ?? 500).json({
      success: false,
      message: error?.message ?? "Lỗi cập nhật nhà cung cấp",
    });
  }
};

export const deleteOrganizer = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    }
    const result = await CatalogService.deleteOrganizer(id);
    return res.json({
      success: true,
      message: "Đã xóa nhà cung cấp",
      data: result,
    });
  } catch (error: any) {
    console.error("deleteOrganizer:", error);
    return res.status(error?.status ?? 500).json({
      success: false,
      message: error?.message ?? "Lỗi xóa nhà cung cấp",
    });
  }
};

export const listArtists = async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const artists = await CatalogService.listArtists(q);
    return res.json({ success: true, data: { artists } });
  } catch (error: any) {
    console.error("listArtists:", error);
    return res.status(500).json({
      success: false,
      message: error?.message ?? "Lỗi tải nghệ sĩ",
    });
  }
};

export const createArtist = async (req: Request, res: Response) => {
  try {
    const artist = await CatalogService.createArtist(req.body ?? {});
    return res.status(201).json({
      success: true,
      message: "Đã tạo nghệ sĩ",
      data: { artist },
    });
  } catch (error: any) {
    console.error("createArtist:", error);
    return res.status(error?.status ?? 500).json({
      success: false,
      message: error?.message ?? "Lỗi tạo nghệ sĩ",
    });
  }
};

export const updateArtist = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    }
    const artist = await CatalogService.updateArtist(id, req.body ?? {});
    return res.json({
      success: true,
      message: "Đã cập nhật nghệ sĩ",
      data: { artist },
    });
  } catch (error: any) {
    console.error("updateArtist:", error);
    return res.status(error?.status ?? 500).json({
      success: false,
      message: error?.message ?? "Lỗi cập nhật nghệ sĩ",
    });
  }
};

export const deleteArtist = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    }
    const result = await CatalogService.deleteArtist(id);
    return res.json({
      success: true,
      message: "Đã xóa nghệ sĩ",
      data: result,
    });
  } catch (error: any) {
    console.error("deleteArtist:", error);
    return res.status(error?.status ?? 500).json({
      success: false,
      message: error?.message ?? "Lỗi xóa nghệ sĩ",
    });
  }
};
