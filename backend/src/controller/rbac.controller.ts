import type { Request, Response } from "express";
import { RbacService } from "../service/rbac.service.js";

export const listRoles = async (_req: Request, res: Response) => {
  try {
    return res.json({
      success: true,
      data: { roles: RbacService.listAssignableRoles() },
    });
  } catch (error) {
    console.error("listRoles:", error);
    return res.status(500).json({ success: false, message: "Lỗi tải roles" });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const users = await RbacService.searchUsers(q);
    return res.json({ success: true, data: { users } });
  } catch (error) {
    console.error("listUsers:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi tải danh sách user" });
  }
};

export const assignUserRole = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const role = String(req.body?.role ?? "");
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ success: false, message: "userId không hợp lệ" });
    }
    if (!role) {
      return res.status(400).json({ success: false, message: "Thiếu role" });
    }

    const user = await RbacService.assignRole(req.auth?.userId, userId, role);
    return res.json({
      success: true,
      message: `Đã gán quyền ${user.role} cho ${user.email}`,
      data: { user },
    });
  } catch (error: any) {
    return res.status(error?.status ?? 500).json({
      success: false,
      message: error?.message ?? "Lỗi gán quyền",
    });
  }
};
