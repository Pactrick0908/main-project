import type { ReactNode } from "react";
import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  ScanLine,
  ExternalLink,
  Gift,
  LogIn,
  MapPin,
  Building2,
  Mic2,
  Shield,
} from "lucide-react";
import { cn } from "cn";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/api/auth.api";
import { toast } from "@/lib/toast";
import logoUrl from "@/assets/logo.svg";

const PROGRAM_ID = "GGadYLQQ5S2r26ajUHEiy7v2NMKN41rJXETb395kbq1H";

function navItem(
  to: string,
  label: string,
  icon: ReactNode,
  active: boolean,
) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function SidebarAdmin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, logout, isAuthenticated, staffRole } = useAuth();
  const [busy, setBusy] = useState(false);
  const path = location.pathname.replace(/\/$/, "") || "/admin";
  const isAdmin = !staffRole || staffRole === "admin";

  const handleAdminLogin = async () => {
    setBusy(true);
    try {
      const session = await authApi.loginAdminDemo();
      login(session.user, session.token);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Đăng nhập admin thất bại",
      );
    } finally {
      setBusy(false);
    }
  };

  const iconCls = "size-3.5 shrink-0";

  return (
    <aside className="sticky top-0 flex h-screen w-48 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-3">
        <div className="flex size-7 items-center justify-center overflow-hidden rounded-md">
          <img src={logoUrl} alt="8Bits" className="size-7" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold tracking-tight">
            8Bits
          </p>
          <p className="text-[9px] font-medium uppercase tracking-wider text-primary">
            Ops · Devnet
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        <p className="px-2 pb-1 pt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Vận hành
        </p>
        {navItem(
          "/admin",
          "Tổng quan",
          <LayoutDashboard className={iconCls} />,
          path === "/admin",
        )}
        {navItem(
          "/admin/places",
          "Địa điểm",
          <MapPin className={iconCls} />,
          path.startsWith("/admin/places"),
        )}
        {isAdmin &&
          navItem(
            "/admin/organizers",
            "Nhà cung cấp",
            <Building2 className={iconCls} />,
            path.startsWith("/admin/organizers"),
          )}
        {navItem(
          "/admin/artists",
          "Nghệ sĩ",
          <Mic2 className={iconCls} />,
          path.startsWith("/admin/artists"),
        )}
        {navItem(
          "/admin/events",
          "Sự kiện",
          <CalendarDays className={iconCls} />,
          path.startsWith("/admin/events"),
        )}
        {navItem(
          "/admin/tickets",
          "Vé đã bán",
          <Ticket className={iconCls} />,
          path.startsWith("/admin/tickets"),
        )}
        {navItem(
          "/admin/airdrop",
          "Cấp vé mời",
          <Gift className={iconCls} />,
          path.startsWith("/admin/airdrop"),
        )}
        {isAdmin &&
          navItem(
            "/admin/rbac",
            "Phân quyền",
            <Shield className={iconCls} />,
            path.startsWith("/admin/rbac"),
          )}

        {isAdmin && (
          <>
            <Separator className="my-2 bg-sidebar-border" />
            <p className="px-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Cổng soát
            </p>
            <NavLink
              to="/admin/scanner"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )
              }
            >
              <ScanLine className={iconCls} />
              <span className="truncate">Trạm QR 60s</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="space-y-2 border-t border-sidebar-border p-2.5">
        {isAuthenticated && user ? (
          <div className="rounded-md bg-muted/60 px-2 py-1.5">
            <p className="truncate text-[11px] font-medium">{user.name}</p>
            <p className="truncate text-[9px] text-muted-foreground">
              {user.role ?? "customer"}
            </p>
            <Button
              variant="ghost"
              size="xs"
              className="mt-0.5 h-5 px-0 text-[10px] text-muted-foreground"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              Đăng xuất
            </Button>
          </div>
        ) : (
          <Button
            size="xs"
            className="h-7 w-full text-[11px]"
            disabled={busy}
            onClick={() => void handleAdminLogin()}
          >
            <LogIn className="size-3" />
            {busy ? "Đang vào…" : "Đăng nhập"}
          </Button>
        )}

        <a
          href={`https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1.5 font-mono text-[9px] text-muted-foreground transition-colors hover:text-primary"
          title="Program ID"
        >
          <span className="truncate">GGadYLQQ…kbq1H</span>
          <ExternalLink className="size-2.5 shrink-0 opacity-60 group-hover:opacity-100" />
        </a>
      </div>
    </aside>
  );
}
