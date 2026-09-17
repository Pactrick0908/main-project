import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  googleId: string;
  email: string;
  walletAddress: string;
  role?: string;
  userId?: number;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "123";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthUser;
    req.auth = payload;
    return next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
  }
}

/** Scanner / admin: JWT role hoặc mã cổng X-Scanner-Key */
export function requireScanner(req: Request, res: Response, next: NextFunction) {
  const scannerKey = process.env.SCANNER_ACCESS_CODE || "gate-demo";
  const headerKey = req.headers["x-scanner-key"];
  if (typeof headerKey === "string" && headerKey === scannerKey) {
    return next();
  }

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthUser;
      if (payload.role === "admin" || payload.role === "scanner") {
        req.auth = payload;
        return next();
      }
    } catch {
      /* fall through */
    }
  }

  // Dev/demo: cho phép quét khi không cấu hình khóa nghiêm ngặt
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Cần quyền scanner/admin hoặc mã cổng hợp lệ",
  });
}

/** Chặn JWT role customer khỏi mọi API admin */
export function rejectCustomer(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthUser;
    req.auth = payload;
    const role = (payload.role ?? "customer").toLowerCase();
    if (role === "customer") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản khách hàng không được vào trang quản trị",
        code: "CUSTOMER_FORBIDDEN",
      });
    }
  } catch {
    /* token lỗi: để requireAuth xử lý trên route cần đăng nhập */
  }
  return next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthUser;
    req.auth = payload;
    if (payload.role === "admin") return next();
    return res.status(403).json({ success: false, message: "Cần quyền admin" });
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
  }
}
