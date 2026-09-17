import type { NextFunction, Request, Response } from "express";
import { RbacService, type ResourceScope } from "../rbac/rbac.service.js";
import type { PermissionCode } from "../rbac/permissions.js";
import { requireAuth } from "./auth.middleware.js";

export { RbacService } from "../rbac/rbac.service.js";

/** Dùng trong service: checkPermission('EVENT_UPDATE', { eventId }) */
export async function checkPermission(
  userId: number,
  permission: PermissionCode,
  scope: ResourceScope = {},
) {
  return RbacService.hasPermission(userId, permission, scope);
}

export type ScopeResolver = (
  req: Request,
) => ResourceScope | Promise<ResourceScope>;

/** Lấy eventId / organizerId từ params, query, body */
export function defaultScopeFromRequest(req: Request): ResourceScope {
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : undefined;
  };
  return {
    eventId:
      num(req.params.eventId) ??
      num(req.params.id) ??
      num(req.query.eventId) ??
      num(req.body?.eventId),
    organizerId:
      num(req.params.organizerId) ??
      num(req.query.organizerId) ??
      num(req.body?.organizerId),
  };
}

/**
 * Guard: requireAuth → JWT userId → UserRoleScope có Permission trên resource.
 *
 * Super Admin (scope GLOBAL) pass mọi resource.
 * Organizer Admin (ORGANIZER) pass mọi event có organizerId = scopeId.
 * Event Operator / Check-in chỉ pass đúng eventId.
 */
export function requirePermission(
  permission: PermissionCode,
  resolveScope: ScopeResolver = defaultScopeFromRequest,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      void (async () => {
        if (res.headersSent) return;

        const userId = req.auth?.userId;
        if (!userId) {
          res.status(401).json({
            success: false,
            message: "Token thiếu userId — đăng nhập lại",
          });
          return;
        }

        const resource = await resolveScope(req);
        const allowed = await RbacService.hasPermission(
          userId,
          permission,
          resource,
        );
        if (!allowed) {
          res.status(403).json({
            success: false,
            message: `Thiếu quyền ${permission} trên tài nguyên này`,
            code: "FORBIDDEN_PERMISSION",
          });
          return;
        }
        next();
      })().catch(next);
    });
  };
}
