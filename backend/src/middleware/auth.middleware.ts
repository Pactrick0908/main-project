import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  PERMISSIONS,
  roleHasPermission,
  type PermissionCode,
} from "../constants/permissions.js";

export interface AuthUser {
  googleId: string;
  email: string;
  walletAddress: string;
  role?: string;
  userId?: number;
  permissions?: string[];
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "123";

function verifyBearer(req: Request): AuthUser | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(header.slice(7), JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

function hasPerm(auth: AuthUser | undefined, permission: string): boolean {
  if (!auth) return false;
  if (Array.isArray(auth.permissions) && auth.permissions.length > 0) {
    return auth.permissions.includes(permission);
  }
  return roleHasPermission(auth.role, permission);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const payload = verifyBearer(req);
  if (!payload) {
    return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
  }
  req.auth = payload;
  return next();
}

/** Scanner / admin / manager: JWT role hoặc mã cổng X-Scanner-Key */
export function requireScanner(req: Request, res: Response, next: NextFunction) {
  const scannerKey = process.env.SCANNER_ACCESS_CODE || "gate-demo";
  const headerKey = req.headers["x-scanner-key"];
  if (typeof headerKey === "string" && headerKey === scannerKey) {
    return next();
  }

  const payload = verifyBearer(req);
  if (payload) {
    req.auth = payload;
    if (
      payload.role === "admin" ||
      payload.role === "manager" ||
      payload.role === "scanner" ||
      hasPerm(payload, PERMISSIONS.ADMIN_WRITE)
    ) {
      return next();
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Cần quyền scanner/admin hoặc mã cổng hợp lệ",
  });
}

/** Có quyền vào khu vực admin (admin / manager / organizer / scanner) */
export function requireAdminAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const payload = verifyBearer(req);
  if (!payload) {
    return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
  }
  req.auth = payload;
  if (hasPerm(payload, PERMISSIONS.ADMIN_ACCESS)) return next();
  return res
    .status(403)
    .json({ success: false, message: "Không có quyền truy cập admin" });
}

/**
 * Vận hành admin (CRUD) — admin + manager.
 * Giữ tên requireAdmin để tương thích route cũ.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requirePermission(PERMISSIONS.ADMIN_WRITE)(req, res, next);
}

export function requireRevenueRead(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  return requirePermission(PERMISSIONS.REVENUE_READ)(req, res, next);
}

export function requireRolesGrant(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  return requirePermission(PERMISSIONS.ROLES_GRANT)(req, res, next);
}

/** Middleware factory — yêu cầu đủ các permission */
export function requirePermission(...needed: PermissionCode[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const payload = verifyBearer(req);
    if (!payload) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }
    req.auth = payload;
    const missing = needed.filter((p) => !hasPerm(payload, p));
    if (missing.length > 0) {
      return res.status(403).json({
        success: false,
        message: `Thiếu quyền: ${missing.join(", ")}`,
      });
    }
    return next();
  };
}

export { hasPerm as authHasPermission };
