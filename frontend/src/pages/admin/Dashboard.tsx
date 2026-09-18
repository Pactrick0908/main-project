import { useCallback, useEffect, useMemo, useState } from "react";
import { TrendingUp, UserCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  adminApi,
  type DashboardStats,
  type RevenuePoint,
} from "@/api/admin.api";
import { useAuth } from "@/context/AuthContext";
import { formatVND } from "@/pages/admin/adminShared";
import { AdminPageShell } from "@/layouts/admin/HeaderAdmin";
import { AdminWalletCard } from "@/pages/admin/AdminWalletCard";
import { cn } from "cn";

const chartConfig = {
  revenue: {
    label: "Doanh thu",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function RevenueChart({
  monthly,
  yearly,
}: {
  monthly: RevenuePoint[];
  yearly: RevenuePoint[];
}) {
  const [range, setRange] = useState<"month" | "year">("month");
  const data = range === "month" ? monthly : yearly;
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border">
        <div>
          <CardTitle>Tổng doanh thu</CardTitle>
          <CardDescription>
            {range === "month" ? "12 tháng gần nhất" : "5 năm gần nhất"} ·{" "}
            {formatVND(total)}
          </CardDescription>
        </div>
        <div className="flex rounded-lg border border-border p-0.5">
          <Button
            type="button"
            size="xs"
            variant={range === "month" ? "default" : "ghost"}
            onClick={() => setRange("month")}
          >
            Tháng
          </Button>
          <Button
            type="button"
            size="xs"
            variant={range === "year" ? "default" : "ghost"}
            onClick={() => setRange("year")}
          >
            Năm
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={72}
              tickFormatter={(v) =>
                v >= 1_000_000
                  ? `${Math.round(v / 1_000_000)}tr`
                  : v >= 1_000
                    ? `${Math.round(v / 1_000)}k`
                    : String(v)
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    formatVND(typeof value === "number" ? value : Number(value) || 0)
                  }
                />
              }
            />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { isAuthenticated, staffRole } = useAuth();
  const isAdmin = staffRole === "admin";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [eventId, setEventId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setError(null);
      try {
        const dash = await adminApi.dashboard(isAdmin ? eventId : undefined);
        setStats(dash.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Không tải được dữ liệu dashboard",
        );
      } finally {
        setLoading(false);
      }
    },
    [eventId, isAdmin],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    void refresh({ silent: Boolean(stats) });
    const id = window.setInterval(() => void refresh({ silent: true }), 20000);
    return () => window.clearInterval(id);
  }, [isAuthenticated, refresh]);

  const selectedTitle = useMemo(() => {
    if (!eventId) return "Tất cả sự kiện";
    return stats?.events.find((e) => e.id === eventId)?.title ?? "Sự kiện";
  }, [eventId, stats?.events]);

  return (
    <AdminPageShell
      title="Tổng quan"
      description={
        isAdmin
          ? "Doanh thu, tỷ lệ vào vé theo sự kiện và biểu đồ theo tháng/năm"
          : "Doanh thu và tỷ lệ vào vé của sự kiện bạn tổ chức"
      }
      loading={loading}
      error={error}
      onRefresh={() => void refresh()}
    >
      <div className="space-y-6">
        {isAdmin && stats?.wallet && <AdminWalletCard wallet={stats.wallet} />}

        {isAdmin && (
          <div className="flex flex-col gap-1.5 sm:max-w-md">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Chuyển sự kiện
            </label>
            <select
              value={eventId ? String(eventId) : ""}
              onChange={(e) =>
                setEventId(e.target.value ? Number(e.target.value) : undefined)
              }
              className="h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Tất cả sự kiện</option>
              {(stats?.events ?? []).map((evt) => (
                <option key={evt.id} value={evt.id}>
                  #{evt.id} {evt.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="gap-3">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                Doanh thu
              </CardDescription>
              <div className="rounded-md bg-muted p-1.5">
                <TrendingUp className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">
                {formatVND(stats?.revenue ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isAdmin ? selectedTitle : "Sự kiện của bạn"}
              </p>
            </CardContent>
          </Card>

          <Card className="gap-3">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                Tỷ lệ vào vé
              </CardDescription>
              <div className="rounded-md bg-muted p-1.5">
                <UserCheck className="size-4 text-success" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-semibold tracking-tight">
                {stats?.checkInRate ?? 0}%
              </p>
              <p className="text-sm text-muted-foreground">
                Đã check-in{" "}
                <span className="font-medium text-foreground">
                  {stats?.checkedIn ?? 0}
                </span>{" "}
                / {stats?.soldTickets ?? 0} vé
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full bg-success transition-all duration-500",
                  )}
                  style={{ width: `${stats?.checkInRate ?? 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <RevenueChart
            monthly={stats?.revenueByMonth ?? []}
            yearly={stats?.revenueByYear ?? []}
          />
        )}
      </div>
    </AdminPageShell>
  );
}
