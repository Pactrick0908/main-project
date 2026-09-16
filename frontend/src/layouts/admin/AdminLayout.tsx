import type { ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  ScanLine,
  ExternalLink,
  Hexagon,
} from "lucide-react";
import { cn } from "cn";
import { Separator } from "@/components/ui/separator";

const PROGRAM_ID = "GGadYLQQ5S2r26ajUHEiy7v2NMKN41rJXETb395kbq1H";

function AdminLayout() {
  const location = useLocation();
  const [params] = useSearchParams();
  const isScanner = location.pathname.startsWith("/admin/scanner");
  const tab = params.get("tab") ?? "dashboard";

  if (isScanner) {
    return <Outlet />;
  }

  const navItem = (
    to: string,
    label: string,
    icon: ReactNode,
    active: boolean,
  ) => (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Hexagon className="size-5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">Ticket3</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-primary">
              Ops · Devnet
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Vận hành
          </p>
          {navItem(
            "/admin",
            "Tổng quan",
            <LayoutDashboard className="size-4" />,
            tab === "dashboard" && location.pathname === "/admin",
          )}
          {navItem(
            "/admin?tab=events",
            "Sự kiện",
            <CalendarDays className="size-4" />,
            tab === "events",
          )}
          {navItem(
            "/admin?tab=tickets",
            "Vé đã bán",
            <Ticket className="size-4" />,
            tab === "tickets",
          )}

          <Separator className="my-3 bg-sidebar-border" />

          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Cổng soát
          </p>
          <NavLink
            to="/admin/scanner"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )
            }
          >
            <ScanLine className="size-4" />
            Trạm QR 60s
          </NavLink>
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Program ID
          </p>
          <a
            href={`https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-lg bg-muted/60 px-2.5 py-2 font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="truncate">GGadYLQQ…kbq1H</span>
            <ExternalLink className="size-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
