import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";

type AdminGuardProps = {
  /** Quyền tối thiểu để vào route con */
  permission?: string;
  /** Redirect khi thiếu quyền */
  fallback?: string;
};

/**
 * Bảo vệ khu vực /admin.
 * - Chưa đăng nhập + guard access: vẫn cho vào layout (nút đăng nhập admin).
 * - Đã đăng nhập nhưng thiếu quyền: redirect.
 */
export default function AdminGuard({
  permission = PERMISSIONS.ADMIN_ACCESS,
  fallback = "/admin",
}: AdminGuardProps) {
  const { isAuthenticated, can } = useAuth();
  const location = useLocation();

  // Cho phép xem shell admin để đăng nhập demo
  if (!isAuthenticated) {
    if (permission === PERMISSIONS.ADMIN_ACCESS) {
      return <Outlet />;
    }
    return <Navigate to="/admin" replace state={{ from: location.pathname }} />;
  }

  if (!can(permission)) {
    if (
      permission !== PERMISSIONS.ADMIN_ACCESS &&
      can(PERMISSIONS.ADMIN_ACCESS)
    ) {
      return <Navigate to={fallback} replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
