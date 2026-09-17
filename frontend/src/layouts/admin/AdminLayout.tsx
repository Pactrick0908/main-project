import { Outlet, useLocation } from "react-router-dom";
import SidebarAdmin from "./SidebarAdmin";

function AdminLayout() {
  const location = useLocation();
  const isScanner = location.pathname.startsWith("/admin/scanner");

  if (isScanner) {
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
