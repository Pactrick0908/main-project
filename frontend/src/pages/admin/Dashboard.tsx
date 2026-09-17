import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Ticket,
  UserCheck,
  CalendarDays,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  adminApi,
  type AdminEvent,
  type DashboardStats,
} from "@/api/admin.api";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "cn";
import { formatVND, StatusBadge } from "@/pages/admin/adminShared";
import { AdminPageShell } from "@/layouts/admin/HeaderAdmin";

export default function Dashboard() {
  const { isAuthenticated, can } = useAuth();
  const navigate = useNavigate();

  const canRevenue = can(PERMISSIONS.REVENUE_READ);
  const canWrite = can(PERMISSIONS.ADMIN_WRITE);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const dash = await adminApi.dashboard().catch(() => null);
      if (dash) setStats(dash.data);

      if (canWrite) {
        const ev = await adminApi.listEvents().catch(() => null);
        if (ev) setEvents(ev.data.events);
      } else {
        setEvents([]);
      }
      setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được dữ liệu admin",
      );
    } finally {
      setLoading(false);
    }
  }, [canWrite]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh();
    const id = window.setInterval(() => void refresh(), 20000);
    return () => window.clearInterval(id);
  }, [isAuthenticated, refresh]);

  const statCards = [
    canRevenue
      ? {
          label: "Doanh thu",
          value: formatVND(stats?.revenue ?? 0),
          icon: <TrendingUp className="size-4 text-primary" />,
        }
      : null,
    canWrite
      ? {
          label: "Vé đã bán",
          value: `${stats?.soldTickets ?? 0}`,
          icon: <Ticket className="size-4 text-primary" />,
        }
      : null,
    canWrite
      ? {
          label: "Đã check-in",
          value: `${stats?.checkedIn ?? 0} / ${stats?.soldTickets ?? 0}`,
          icon: <UserCheck className="size-4 text-success" />,
        }
      : null,
    canWrite
      ? {
          label: "Sự kiện",
          value: `${stats?.eventsActive ?? 0} / ${stats?.eventsTotal ?? 0}`,
          icon: <CalendarDays className="size-4 text-primary" />,
        }
      : null,
    canRevenue && !canWrite
      ? {
          label: "Doanh thu hệ thống",
          value: formatVND(stats?.systemRevenue ?? 0),
          icon: <TrendingUp className="size-4 text-primary" />,
        }
      : null,
    canRevenue && !canWrite
      ? {
          label: "Đơn đã thanh toán",
          value: `${stats?.paidOrders ?? 0}`,
          icon: <Ticket className="size-4 text-primary" />,
        }
      : null,
    canRevenue && !canWrite
      ? {
          label: "Doanh thu đơn hàng",
          value: formatVND(stats?.orderRevenue ?? 0),
          icon: <CalendarDays className="size-4 text-primary" />,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    icon: ReactNode;
  }>;

  return (
    <AdminPageShell
      title={canRevenue && !canWrite ? "Doanh thu" : "Tổng quan"}
      description={
        canRevenue && !canWrite
          ? "Chỉ xem doanh thu — không có quyền vận hành"
          : canWrite && !canRevenue
            ? "Vận hành sự kiện & vé (ẩn doanh thu)"
            : "Doanh thu, vé bán và tỷ lệ check-in theo thời gian thực"
      }
      lastUpdated={lastUpdated}
      loading={loading}
      error={error}
      onRefresh={() => void refresh()}
      showCreateEvent={canWrite}
    >
      <div className="space-y-6">
        {!canRevenue && canWrite && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Tài khoản <strong>Manager</strong> không được xem doanh thu. Các
              chỉ số tài chính đã bị ẩn.
            </span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="gap-3">
              <CardHeader className="flex flex-row items-center justify-between pb-0">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                  {stat.label}
                </CardDescription>
                <div className="rounded-md bg-muted p-1.5">{stat.icon}</div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {canWrite && (
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader className="border-b border-border">
                <CardTitle>Tỷ lệ check-in</CardTitle>
                <CardDescription>
                  {stats?.checkedIn ?? 0} vé đã vào · {stats?.checkInRate ?? 0}%
                  {stats?.revoked ? ` · ${stats.revoked} đã khóa` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-500"
                    style={{ width: `${stats?.checkInRate ?? 0}%` }}
                  />
                </div>
                <div className="mt-6 space-y-3">
                  {(stats?.recentTickets ?? []).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {t.ownerName ?? t.ownerEmail ?? `Vé #${t.id}`}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t.event.title}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "shrink-0 rounded-md",
                          t.isCheckedIn
                            ? "bg-success/15 text-success"
                            : "bg-amber-500/15 text-amber-400",
                        )}
                      >
                        {t.isCheckedIn ? "Đã vào" : "Chưa vào"}
                      </Badge>
                    </div>
                  ))}
                  {!stats?.recentTickets?.length && (
                    <p className="text-sm text-muted-foreground">
                      Chưa có vé. Tạo sự kiện rồi cấp vé mời / bán vé.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="border-b border-border">
                <CardTitle>Sự kiện</CardTitle>
                <CardDescription>Cung cầu theo hạng vé</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {events.slice(0, 5).map((evt) => {
                  const capacity = evt.zones.reduce(
                    (s, z) => s + z.totalSeats,
                    0,
                  );
                  const soldPct = capacity
                    ? Math.min(
                        100,
                        Math.round((evt.soldTickets / capacity) * 100),
                      )
                    : 0;
                  return (
                    <div key={evt.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {evt.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {evt.soldTickets}/{capacity || "?"} vé · {soldPct}%
                          </p>
                        </div>
                        <StatusBadge status={evt.status} />
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${soldPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/admin/events")}
                >
                  Quản lý sự kiện
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {canRevenue && !canWrite && (
          <Card>
            <CardHeader>
              <CardTitle>Ghi chú quyền</CardTitle>
              <CardDescription>
                Tài khoản nhà tổ chức chỉ được xem các chỉ số doanh thu phía
                trên. Liên hệ admin nếu cần quyền vận hành.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </AdminPageShell>
  );
}
