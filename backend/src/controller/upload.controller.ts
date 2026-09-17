import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import {
  isCloudinaryConfigured,
  uploadImageBuffer,
} from "../lib/cloudinary.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Chỉ chấp nhận file ảnh"));
      return;
    }
    cb(null, true);
  },
});

export const uploadImageMiddleware = upload.single("file");

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          "Chưa cấu hình Cloudinary. Thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET vào .env",
      });
    }

    const file = req.file;
    if (!file?.buffer?.length) {
      return res.status(400).json({
        success: false,
        message: "Thiếu file ảnh (field name: file)",
      });
    }

    const folderRaw =
      typeof req.body?.folder === "string" ? req.body.folder.trim() : "";
    const allowedFolders = new Set([
      "artists",
      "organizers",
      "events",
      "maps",
      "misc",
    ]);
    const sub = allowedFolders.has(folderRaw) ? folderRaw : "misc";
    const base = process.env.CLOUDINARY_FOLDER?.trim() || "ticket3";

    const result = await uploadImageBuffer(file.buffer, {
      folder: `${base}/${sub}`,
      mimeType: file.mimetype,
    });

    return res.status(201).json({
      success: true,
      message: "Đã upload ảnh lên Cloudinary",
      data: {
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (error: any) {
    console.error("uploadImage:", error);
    return res.status(error?.status ?? 500).json({
      success: false,
      message: error?.message ?? "Lỗi upload ảnh",
    });
  }
};

/** Multer error → JSON */
export function handleUploadError(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    const msg =
      err.code === "LIMIT_FILE_SIZE"
        ? "Ảnh tối đa 5MB"
        : err.message || "Lỗi upload";
    return res.status(400).json({ success: false, message: msg });
  }
  if (err instanceof Error) {
    return res.status(400).json({ success: false, message: err.message });
  }
  return next(err);
}
