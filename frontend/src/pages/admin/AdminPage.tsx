import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  Ticket,
  UserCheck,
  CalendarDays,
  MapPin,
  Ban,
  Gift,
  ShieldAlert,
  Armchair,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  adminApi,
  type AdminEvent,
  type DashboardStats,
} from "@/api/admin.api";
import type { TicketDto } from "@/api/ticket.api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "cn";

export type TabType = "dashboard" | "events" | "tickets" | "airdrop";

type ZoneDraft = {
  key: string;
  zoneId?: number;
  name: string;
  price: string;
  totalSeats: string;
  /** Số hàng ghế — chỉ dùng khi hasSeats */
  rowCount: string;
  hasSeats: boolean;
};

type PlaceOption = {
  id: number;
  name: string;
  address: string;
  city: string;
  zones: Array<{
    id: number;
    name: string;
    hasSeats: boolean;
    _count: { seats: number };
  }>;
};

const DEFAULT_ZONES: ZoneDraft[] = [
  {
    key: "z1",
    name: "VIP",
    price: "3500000",
    totalSeats: "100",
    rowCount: "10",
    hasSeats: true,
  },
  {
    key: "z2",
    name: "Standard",
    price: "1500000",
    totalSeats: "500",
    rowCount: "25",
    hasSeats: true,
  },
  {
    key: "z3",
    name: "Standing / GA",
    price: "800000",
    totalSeats: "800",
    rowCount: "",
    hasSeats: false,
  },
];

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount,
  );

/** Preview nhãn hàng: 0→A, 25→Z, 26→AA */
function rowLabelPreview(rowIndex: number): string {
  if (rowIndex < 0) return "A";
  let n = rowIndex;
  let label = "";
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-success/15 text-success",
    upcoming: "bg-sky-500/15 text-sky-400",
    draft: "bg-muted text-muted-foreground",
    ended: "bg-muted text-muted-foreground",
  };
  const label: Record<string, string> = {
    active: "Đang mở bán",
    upcoming: "Sắp diễn ra",
    draft: "Nháp",
    ended: "Đã kết thúc",
  };
  return (
    <Badge
      variant="secondary"
      className={cn("rounded-md", map[status] ?? "bg-muted text-muted-foreground")}
    >
      {label[status] ?? status}
    </Badge>
  );
}

export default function AdminPage() {
  const { isAuthenticated, user } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeTab = (params.get("tab") as TabType) || "dashboard";

  const setTab = (tab: TabType) => {
    if (tab === "dashboard") setParams({});
    else setParams({ tab });
  };

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: "",
    location: "",
    city: "Hà Nội",
    address: "",
    date: "",
    bannerUrl: "",
    placeId: "",
  });
  const [zoneDrafts, setZoneDrafts] = useState<ZoneDraft[]>(DEFAULT_ZONES);
  const [places, setPlaces] = useState<PlaceOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [airdrop, setAirdrop] = useState({
    eventId: "",
    eventZoneId: "",
    email: "",
    walletAddress: "",
  });
  const [airdropBusy, setAirdropBusy] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [dash, ev, tk, pl] = await Promise.all([
        adminApi.dashboard().catch(() => null),
        adminApi.listEvents(),
        adminApi.listTickets(searchQuery || undefined).catch(() => ({
          data: { tickets: [] as TicketDto[] },
        })),
        adminApi.listPlaces().catch(() => ({ data: { places: [] } })),
      ]);
      if (dash) setStats(dash.data);
      setEvents(ev.data.events);
      setTickets(tk.data.tickets);
      setPlaces(pl.data.places);
      setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu admin");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

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

  const selectedEvent = useMemo(
    () => events.find((e) => String(e.id) === airdrop.eventId),
    [events, airdrop.eventId],
  );

  const selectedPlace = useMemo(
    () => places.find((p) => String(p.id) === newEvent.placeId),
    [places, newEvent.placeId],
  );

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;
    if (!newEvent.placeId && !newEvent.location.trim()) {
      alert("Chọn địa điểm có sẵn hoặc nhập địa điểm mới");
      return;
    }
    if (!zoneDrafts.length) {
      alert("Cần ít nhất 1 khu vực / hạng vé");
      return;
    }
    for (const z of zoneDrafts) {
      if (!z.name.trim() || !(Number(z.price) > 0) || !(Number(z.totalSeats) >= 1)) {
        alert(`Khu "${z.name || "?"}" cần tên, giá > 0 và số lượng ≥ 1`);
        return;
      }
      if (z.hasSeats) {
        const rows = Number(z.rowCount);
        if (!Number.isInteger(rows) || rows < 1) {
          alert(`Khu "${z.name}" (có ghế) cần nhập số hàng ≥ 1`);
          return;
        }
        if (rows > Number(z.totalSeats)) {
          alert(`Khu "${z.name}": số hàng không được lớn hơn tổng ghế`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      await adminApi.createEvent({
        title: newEvent.title,
        bannerUrl: newEvent.bannerUrl || undefined,
        status: "active",
        ...(newEvent.placeId
          ? { placeId: Number(newEvent.placeId) }
          : {
              place: {
                name: newEvent.location.trim(),
                address: newEvent.address || newEvent.location.trim(),
                city: newEvent.city || "Hà Nội",
              },
            }),
        startTime: newEvent.date
          ? new Date(`${newEvent.date}T18:00:00`).toISOString()
          : undefined,
        endTime: newEvent.date
          ? new Date(`${newEvent.date}T23:00:00`).toISOString()
          : undefined,
        zones: zoneDrafts.map((z) => ({
          ...(z.zoneId ? { zoneId: z.zoneId } : {}),
          name: z.name.trim(),
          price: Number(z.price),
          totalSeats: Number(z.totalSeats),
          hasSeats: z.hasSeats,
          ...(z.hasSeats ? { rowCount: Number(z.rowCount) } : {}),
          generateSeats: z.hasSeats,
        })),
      });
      setNewEvent({
        title: "",
        location: "",
        city: "Hà Nội",
        address: "",
        date: "",
        bannerUrl: "",
        placeId: "",
      });
      setZoneDrafts(DEFAULT_ZONES.map((z) => ({ ...z, key: `${z.key}-${Date.now()}` })));
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Tạo sự kiện thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateZoneDraft = (key: string, patch: Partial<ZoneDraft>) => {
    setZoneDrafts((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  };

  const addZoneDraft = () => {
    setZoneDrafts((rows) => [
      ...rows,
      {
        key: `z-${Date.now()}`,
        name: "",
        price: "1000000",
        totalSeats: "100",
        rowCount: "10",
        hasSeats: true,
      },
    ]);
  };

  const removeZoneDraft = (key: string) => {
    setZoneDrafts((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.key !== key)));
  };

  const applyPlaceZones = (placeId: string) => {
    setNewEvent((s) => ({ ...s, placeId }));
    const place = places.find((p) => String(p.id) === placeId);
    if (!place?.zones.length) return;
    setZoneDrafts(
      place.zones.map((z, i) => ({
        key: `pz-${z.id}-${i}`,
        zoneId: z.id,
        name: z.name,
        price: "1500000",
        totalSeats: String(Math.max(z._count.seats || 50, 50)),
        rowCount: z.hasSeats ? "10" : "",
        hasSeats: z.hasSeats,
      })),
    );
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await adminApi.updateEvent(id, { status });
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cập nhật thất bại");
    }
  };

  const handleDeleteEvent = async (id: number, title: string) => {
    if (!confirm(`Xóa sự kiện "${title}"?`)) return;
    try {
      await adminApi.deleteEvent(id);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa thất bại");
    }
  };

  const handleCheckIn = async (ticketId: number) => {
    try {
      await adminApi.checkIn(ticketId);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Check-in thất bại");
    }
  };

  const handleRevoke = async (ticketId: number) => {
    const reason = prompt("Lý do khóa vé (gian lận / hủy)?") ?? "";
    if (reason === null) return;
    try {
      await adminApi.revoke(ticketId, reason || "admin");
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Khóa vé thất bại");
    }
  };

  const handleAirdrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!airdrop.eventId || !airdrop.eventZoneId) return;
    if (!airdrop.email && !airdrop.walletAddress) {
      alert("Nhập email hoặc địa chỉ ví người nhận");
      return;
    }
    setAirdropBusy(true);
    try {
      const res = await adminApi.airdrop({
        eventId: Number(airdrop.eventId),
        eventZoneId: Number(airdrop.eventZoneId),
        email: airdrop.email || undefined,
        walletAddress: airdrop.walletAddress || undefined,
      });
      alert(`Đã cấp vé #${res.data.ticket.id}`);
      setAirdrop((s) => ({ ...s, email: "", walletAddress: "" }));
      await refresh();
      setTab("tickets");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cấp vé thất bại");
    } finally {
      setAirdropBusy(false);
    }
  };

  const titles: Record<TabType, { title: string; desc: string }> = {
    dashboard: {
      title: "Tổng quan",
      desc: "Doanh thu, vé bán và tỷ lệ check-in theo thời gian thực",
    },
    events: {
      title: "Sự kiện",
      desc: "Tạo chương trình, hạng vé và quản lý trạng thái",
    },
    tickets: {
      title: "Vé đã bán",
      desc: "Tìm kiếm, check-in thủ công và khóa vé gian lận",
    },
    airdrop: {
      title: "Cấp vé mời",
      desc: "Airdrop vé đặc biệt theo email hoặc địa chỉ ví",
    },
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <ShieldAlert className="size-10 text-primary" />
        <h1 className="text-xl font-semibold">Cần đăng nhập Admin</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Bấm <strong>Đăng nhập Admin</strong> ở sidebar để vào tài khoản vận hành
          và dùng đầy đủ nghiệp vụ.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-6 backdrop-blur-md sm:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <h1 className="whitespace-nowrap text-base font-semibold tracking-tight">
                {titles[activeTab].title}
              </h1>
              {lastUpdated && (
                <span className="hidden rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground lg:inline">
                  Live · {lastUpdated}
                </span>
              )}
              {user?.role && (
                <Badge variant="secondary" className="rounded-md capitalize">
                  {user.role}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {titles[activeTab].desc}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void refresh()}
              title="Làm mới"
            >
              <RefreshCw className="size-3.5" />
            </Button>
            {activeTab !== "events" && (
              <Button size="sm" onClick={() => setTab("events")}>
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">Thêm sự kiện</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6 sm:p-8">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {loading && (
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Đang đồng bộ dữ liệu vận hành…
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Doanh thu",
                  value: formatVND(stats?.revenue ?? 0),
                  icon: <TrendingUp className="size-4 text-primary" />,
                },
                {
                  label: "Vé đã bán",
                  value: `${stats?.soldTickets ?? 0}`,
                  icon: <Ticket className="size-4 text-primary" />,
                },
                {
                  label: "Đã check-in",
                  value: `${stats?.checkedIn ?? 0} / ${stats?.soldTickets ?? 0}`,
                  icon: <UserCheck className="size-4 text-success" />,
                },
                {
                  label: "Sự kiện",
                  value: `${stats?.eventsActive ?? 0} / ${stats?.eventsTotal ?? 0}`,
                  icon: <CalendarDays className="size-4 text-primary" />,
                },
              ].map((stat) => (
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
                    onClick={() => setTab("events")}
                  >
                    Quản lý sự kiện
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle>Tạo sự kiện mới</CardTitle>
                <CardDescription>
                  Place → Zone (khu vật lý) → EventZone (giá & cung). Có ghế thì
                  hệ thống sinh sơ đồ ghế.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <form
                  onSubmit={(e) => void handleCreateEvent(e)}
                  className="space-y-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Tên sự kiện *
                      </label>
                      <Input
                        required
                        value={newEvent.title}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, title: e.target.value })
                        }
                        placeholder="Concert Solana Live 2026"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Địa điểm có sẵn (tái dùng Zone)
                      </label>
                      <select
                        value={newEvent.placeId}
                        onChange={(e) => applyPlaceZones(e.target.value)}
                        className="h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="">— Tạo địa điểm mới bên dưới —</option>
                        {places.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.id} {p.name} ({p.city}) · {p.zones.length} khu
                          </option>
                        ))}
                      </select>
                      {selectedPlace && (
                        <p className="text-[11px] text-muted-foreground">
                          Đã nạp {selectedPlace.zones.length} zone từ địa điểm.
                          Chỉ cần chỉnh giá / cung cho sự kiện này.
                        </p>
                      )}
                    </div>

                    {!newEvent.placeId && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Tên địa điểm mới *
                          </label>
                          <Input
                            value={newEvent.location}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                location: e.target.value,
                              })
                            }
                            placeholder="SVĐ Mỹ Đình"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Thành phố
                          </label>
                          <Input
                            value={newEvent.city}
                            onChange={(e) =>
                              setNewEvent({ ...newEvent, city: e.target.value })
                            }
                            placeholder="Hà Nội"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            Địa chỉ
                          </label>
                          <Input
                            value={newEvent.address}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                address: e.target.value,
                              })
                            }
                            placeholder="Đường Lê Đức Thọ, Nam Từ Liêm"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Ngày diễn ra
                      </label>
                      <Input
                        type="date"
                        value={newEvent.date}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, date: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        URL poster
                      </label>
                      <Input
                        type="url"
                        value={newEvent.bannerUrl}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            bannerUrl: e.target.value,
                          })
                        }
                        placeholder="https://…"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          Khu vực / hạng vé (Zone)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Có ghế: nhập số hàng để đánh số (vd 100 ghế / 10 hàng →
                          A1–A10 … J1–J10). Đứng: không sinh ghế.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addZoneDraft}
                      >
                        <Plus className="size-3.5" />
                        Thêm khu
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {zoneDrafts.map((z, idx) => (
                        <div
                          key={z.key}
                          className="rounded-xl border border-border bg-muted/20 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-muted-foreground">
                              Khu #{idx + 1}
                              {z.zoneId ? ` · zoneId ${z.zoneId}` : ""}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => removeZoneDraft(z.key)}
                              disabled={zoneDrafts.length <= 1}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="space-y-1">
                              <label className="text-[11px] text-muted-foreground">
                                Tên khu *
                              </label>
                              <Input
                                required
                                value={z.name}
                                onChange={(e) =>
                                  updateZoneDraft(z.key, {
                                    name: e.target.value,
                                    zoneId: undefined,
                                  })
                                }
                                placeholder="VIP / Standard / GA"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] text-muted-foreground">
                                Giá (VNĐ) *
                              </label>
                              <Input
                                type="number"
                                required
                                min={1}
                                value={z.price}
                                onChange={(e) =>
                                  updateZoneDraft(z.key, {
                                    price: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] text-muted-foreground">
                                Tổng ghế / cung *
                              </label>
                              <Input
                                type="number"
                                required
                                min={1}
                                value={z.totalSeats}
                                onChange={(e) =>
                                  updateZoneDraft(z.key, {
                                    totalSeats: e.target.value,
                                  })
                                }
                              />
                            </div>
                            {z.hasSeats ? (
                              <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground">
                                  Số hàng *
                                </label>
                                <Input
                                  type="number"
                                  required
                                  min={1}
                                  value={z.rowCount}
                                  onChange={(e) =>
                                    updateZoneDraft(z.key, {
                                      rowCount: e.target.value,
                                    })
                                  }
                                  placeholder="vd: 10 → A..J"
                                />
                                {Number(z.rowCount) >= 1 &&
                                  Number(z.totalSeats) >= 1 && (
                                    <p className="text-[10px] text-muted-foreground">
                                      ~{Math.ceil(Number(z.totalSeats) / Number(z.rowCount))}{" "}
                                      ghế/hàng · A1…
                                      {rowLabelPreview(
                                        Number(z.rowCount) - 1,
                                      )}
                                      {Math.ceil(
                                        Number(z.totalSeats) / Number(z.rowCount),
                                      )}
                                    </p>
                                  )}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground">
                                  Số hàng
                                </label>
                                <div className="flex h-8 items-center rounded-lg border border-dashed border-border px-2.5 text-xs text-muted-foreground">
                                  Không áp dụng (đứng)
                                </div>
                              </div>
                            )}
                            <div className="space-y-1">
                              <label className="text-[11px] text-muted-foreground">
                                Loại khu
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  updateZoneDraft(z.key, {
                                    hasSeats: !z.hasSeats,
                                    rowCount: !z.hasSeats
                                      ? z.rowCount || "10"
                                      : "",
                                  })
                                }
                                className={cn(
                                  "flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition-colors",
                                  z.hasSeats
                                    ? "border-primary/40 bg-primary/10 text-primary"
                                    : "border-border bg-input/30 text-muted-foreground",
                                )}
                              >
                                {z.hasSeats ? (
                                  <>
                                    <Armchair className="size-3.5" />
                                    Có ghế
                                  </>
                                ) : (
                                  <>
                                    <Users className="size-3.5" />
                                    Đứng / GA
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      <Plus className="size-3.5" />
                      {isSubmitting ? "Đang tạo…" : "Tạo sự kiện + zones"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {events.map((evt) => (
                <Card key={evt.id} className="gap-0 overflow-hidden p-0">
                  <div className="relative h-36 overflow-hidden bg-muted">
                    {evt.bannerUrl ? (
                      <img
                        src={evt.bannerUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <CalendarDays className="size-8 opacity-40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                      <StatusBadge status={evt.status} />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        #{evt.id}
                      </span>
                    </div>
                  </div>
                  <CardContent className="space-y-3 p-4">
                    <div>
                      <h3 className="font-medium leading-snug">{evt.title}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        {evt.place.name}, {evt.place.city}
                      </p>
                    </div>
                    <div className="space-y-1 text-sm">
                      {evt.zones.map((z) => (
                        <div
                          key={z.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            {z.hasSeats ? (
                              <Armchair className="size-3" />
                            ) : (
                              <Users className="size-3" />
                            )}
                            {z.name}
                          </span>
                          <span className="shrink-0 text-right">
                            {formatVND(z.price)} · {z.soldTickets}/{z.totalSeats}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <select
                        value={evt.status}
                        onChange={(e) =>
                          void handleStatusChange(evt.id, e.target.value)
                        }
                        className="h-8 flex-1 rounded-lg border border-input bg-input/30 px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="draft">Nháp</option>
                        <option value="upcoming">Sắp diễn ra</option>
                        <option value="active">Đang mở bán</option>
                        <option value="ended">Đã kết thúc</option>
                      </select>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => void handleDeleteEvent(evt.id, evt.title)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!events.length && (
                <p className="text-sm text-muted-foreground md:col-span-2">
                  Chưa có sự kiện nào trong database.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "tickets" && (
          <Card className="gap-0 overflow-hidden p-0">
            <CardHeader className="border-b border-border py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Danh sách vé</CardTitle>
                  <CardDescription>{tickets.length} kết quả</CardDescription>
                </div>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => void refresh()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void refresh();
                  }}
                  placeholder="Tìm tên, email, ví, mã vé…"
                  className="max-w-xs"
                />
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Vé</th>
                    <th className="px-4 py-3">Khách</th>
                    <th className="px-4 py-3">Sự kiện</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">#{t.id}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {t.ownerWallet
                            ? `${t.ownerWallet.slice(0, 4)}…${t.ownerWallet.slice(-4)}`
                            : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{t.ownerName ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.ownerEmail ?? t.zoneName}
                          {t.seatLabel ? ` · ${t.seatLabel}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[200px] truncate">{t.event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatVND(t.price)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "rounded-md",
                            t.status === "revoked"
                              ? "bg-destructive/15 text-destructive"
                              : t.isCheckedIn
                                ? "bg-success/15 text-success"
                                : "bg-amber-500/15 text-amber-400",
                          )}
                        >
                          {t.status === "revoked"
                            ? "Đã khóa"
                            : t.isCheckedIn
                              ? "Đã check-in"
                              : "Chưa vào"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {!t.isCheckedIn && t.status !== "revoked" && (
                            <Button
                              size="xs"
                              onClick={() => void handleCheckIn(t.id)}
                            >
                              Check-in
                            </Button>
                          )}
                          {t.status !== "revoked" && !t.isCheckedIn && (
                            <Button
                              size="xs"
                              variant="destructive"
                              onClick={() => void handleRevoke(t.id)}
                            >
                              <Ban className="size-3" />
                              Khóa
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!tickets.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        Không có vé phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === "airdrop" && (
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <Gift className="size-4 text-primary" />
                Cấp vé mời / Airdrop
              </CardTitle>
              <CardDescription>
                Mint vé vào ví khách theo email (tự tạo user) hoặc địa chỉ ví có sẵn —
                không qua thanh toán
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <form
                onSubmit={(e) => void handleAirdrop(e)}
                className="mx-auto grid max-w-xl gap-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Sự kiện *
                  </label>
                  <select
                    required
                    value={airdrop.eventId}
                    onChange={(e) =>
                      setAirdrop({
                        eventId: e.target.value,
                        eventZoneId: "",
                        email: airdrop.email,
                        walletAddress: airdrop.walletAddress,
                      })
                    }
                    className="h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">Chọn sự kiện</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        #{ev.id} — {ev.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Hạng vé *
                  </label>
                  <select
                    required
                    value={airdrop.eventZoneId}
                    onChange={(e) =>
                      setAirdrop({ ...airdrop, eventZoneId: e.target.value })
                    }
                    className="h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    disabled={!selectedEvent}
                  >
                    <option value="">Chọn hạng</option>
                    {selectedEvent?.zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} — {formatVND(z.price)} ({z.soldTickets}/
                        {z.totalSeats})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Email người nhận
                  </label>
                  <Input
                    type="email"
                    value={airdrop.email}
                    onChange={(e) =>
                      setAirdrop({ ...airdrop, email: e.target.value })
                    }
                    placeholder="guest@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Hoặc địa chỉ ví Solana
                  </label>
                  <Input
                    value={airdrop.walletAddress}
                    onChange={(e) =>
                      setAirdrop({ ...airdrop, walletAddress: e.target.value })
                    }
                    placeholder="Base58 pubkey…"
                    className="font-mono text-xs"
                  />
                </div>
                <Button type="submit" disabled={airdropBusy}>
                  <Gift className="size-3.5" />
                  {airdropBusy ? "Đang cấp…" : "Cấp vé ngay"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
