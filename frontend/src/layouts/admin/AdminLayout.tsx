import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { organizerCanAccess } from "@/api/auth.api";
import SidebarAdmin from "./SidebarAdmin";
import NotFoundPage from "@/pages/NotFoundPage";

function AdminLayout() {
  const location = useLocation();
  const { staffRole } = useAuth();
  const isScannerPage = location.pathname.startsWith("/admin/scanner");

  if (!staffRole) {
    return <NotFoundPage />;
  }

  if (staffRole === "scanner" && !isScannerPage) {
    return <Navigate to="/admin/scanner" replace />;
  }

  if (staffRole === "organizer" && !organizerCanAccess(location.pathname)) {
    return <Navigate to="/admin" replace />;
  }

  if (isScannerPage) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarAdmin />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
