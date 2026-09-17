import type { Request, Response } from "express";
import { z } from "zod";
import { RbacService } from "../rbac/rbac.service.js";

const assignSchema = z.object({
  userId: z.coerce.number().int().positive(),
  roleId: z.coerce.number().int().positive(),
  scopeType: z.enum(["GLOBAL", "ORGANIZER", "EVENT"]),
  scopeId: z.coerce.number().int().nonnegative().optional().default(0),
});

function actorId(req: Request): number {
  const id = req.auth?.userId;
  if (!id) {
    throw Object.assign(new Error("Chưa đăng nhập"), { status: 401 });
  }
  return id;
}

export const assignRole = async (req: Request, res: Response) => {
  try {
    const parsed = assignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: parsed.error.flatten(),
      });
    }
    const data = await RbacService.assignRole(actorId(req), parsed.data);
    return res.status(201).json({
      success: true,
      message: "Đã gán vai trò",
      data: { assignment: data },
    });
  } catch (error: any) {
    return res.status(error?.status ?? 500).json({
      success: false,
      message: error?.message ?? "Không gán được vai trò",
    });
  }
};

export const revokeRole = async (req: Request, res: Response) => {
  try {
    const parsed = assignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: parsed.error.flatten(),
      });
    }
    const data = await RbacService.revokeRole(actorId(req), parsed.data);
    return res.json({
      success: true,
      message: "Đã thu hồi vai trò",
      data,
    });
  } catch (error: any) {
    return res.status(error?.status ?? 500).json({
      success: false,
      message: error?.message ?? "Không thu hồi được vai trò",
    });
  }
};

export const getMyPermissions = async (req: Request, res: Response) => {
  try {
    const data = await RbacService.getMyPermissions(actorId(req));
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(error?.status ?? 500).json({
      success: false,
      message: error?.message ?? "Không đọc được quyền",
    });
  }
};

export const getRbacCatalog = async (req: Request, res: Response) => {
  try {
    const data = await RbacService.getCatalog(actorId(req));
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(error?.status ?? 500).json({
      success: false,
      message: error?.message ?? "Không tải được phân quyền",
    });
  }
};
