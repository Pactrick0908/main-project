import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  TrendingUp,
  Ticket,
  UserCheck,
  CalendarDays,
  MapPin,
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
import { ticketApi, type TicketDto } from "@/api/ticket.api";
import { cn } from "cn";

export type TabType = "dashboard" | "events" | "tickets";

export interface EventItem {
  id: string;
  name: string;
  location: string;
  date: string;
  priceVnd: number;
  totalTickets: number;
  soldTickets: number;
  posterUrl: string;
  status: "active" | "upcoming" | "ended";
  merkleTreeAddress: string;
}

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount,
  );

const STATUS_LABEL: Record<EventItem["status"], string> = {
  active: "Đang mở bán",
  upcoming: "Sắp diễn ra",
  ended: "Đã kết thúc",
};

function StatusBadge({ status }: { status: EventItem["status"] }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-md",
        status === "active" && "bg-success/15 text-success",
        status === "upcoming" && "bg-sky-500/15 text-sky-400",
        status === "ended" && "bg-muted text-muted-foreground",
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export default function AdminPage() {
  const [params, setParams] = useSearchParams();
  const activeTab = (params.get("tab") as TabType) || "dashboard";

  const setTab = (tab: TabType) => {
    if (tab === "dashboard") setParams({});
    else setParams({ tab });
  };

  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [events, setEvents] = useState<EventItem[]>([
    {
      id: "EVT-001",
      name: "Đêm Nhạc Indie 2026 (Solana Live)",
      location: "Sân vận động Mỹ Đình, Hà Nội",
      date: "26/08/2026",
      priceVnd: 1500000,
      totalTickets: 100,
      soldTickets: 5,
      posterUrl:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
      status: "active",
      merkleTreeAddress: "GGadYLQQ5S2r26ajUHEiy7v2NMKN41rJXETb395kbq1H",
    },
    {
      id: "EVT-002",
      name: "Rap Việt All-Star Concert 2026",
      location: "SECC, Q.7, TP. HCM",
      date: "15/11/2026",
      priceVnd: 2200000,
      totalTickets: 1500,
      soldTickets: 980,
      posterUrl:
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
      status: "upcoming",
      merkleTreeAddress: "GGadYLQQ5S2r26ajUHEiy7v2NMKN41rJXETb395kbq1H",
    },
  ]);

  const [newEvent, setNewEvent] = useState({
    name: "",
    location: "",
    date: "",
    priceVnd: "",
    totalTickets: "",
    posterUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = useCallback(async (initial = false) => {
    if (initial) setIsLoading(true);
    try {
      const res = await Promise.race([
        ticketApi.listAll(),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error("timeout")), 5000),
        ),
      ]);
      setTickets(res.data.tickets);
      setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTickets(true);
    const id = window.setInterval(() => void fetchTickets(false), 15000);
    return () => window.clearInterval(id);
  }, [fetchTickets]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.priceVnd || !newEvent.totalTickets) return;
    setIsSubmitting(true);
    window.setTimeout(() => {
      setEvents((prev) => [
        {
          id: `EVT-${Math.floor(100 + Math.random() * 900)}`,
          name: newEvent.name,
          location: newEvent.location || "Địa điểm TBD",
          date: newEvent.date || "TBD",
          priceVnd: Number(newEvent.priceVnd),
          totalTickets: Number(newEvent.totalTickets),
          soldTickets: 0,
          posterUrl:
            newEvent.posterUrl ||
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
          status: "active",
          merkleTreeAddress: "GGadYLQQ5S2r26ajUHEiy7v2NMKN41rJXETb395kbq1H",
        },
        ...prev,
      ]);
      setNewEvent({
        name: "",
        location: "",
        date: "",
        priceVnd: "",
        totalTickets: "",
        posterUrl: "",
      });
      setIsSubmitting(false);
    }, 350);
  };

  const handleDeleteEvent = (eventId: string, eventName: string) => {
    if (confirm(`Xóa sự kiện "${eventName}"?`)) {
      setEvents((prev) => prev.filter((evt) => evt.id !== eventId));
    }
  };

  const handleEventStatusChange = (
    eventId: string,
    newStatus: EventItem["status"],
  ) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId ? { ...evt, status: newStatus } : evt,
      ),
    );
  };

  const handleQuickCheckIn = async (ticketId: number) => {
    // Local optimistic for admin emergency check-in display
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              isCheckedIn: true,
              checkedInAt: new Date().toISOString(),
              status: "checked_in",
            }
          : t,
      ),
    );
  };

  const checkedInCount = tickets.filter((t) => t.isCheckedIn).length;
  const totalRevenue = tickets.reduce((acc, t) => acc + (t.price || 0), 0);
  const checkInRate =
    tickets.length > 0 ? Math.round((checkedInCount / tickets.length) * 100) : 0;

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        String(t.id).includes(q) ||
        t.event.title.toLowerCase().includes(q) ||
        t.ownerWallet?.toLowerCase().includes(q) ||
        t.ownerName?.toLowerCase().includes(q) ||
        t.ownerEmail?.toLowerCase().includes(q),
    );
  }, [tickets, searchQuery]);

  const titles: Record<TabType, { title: string; desc: string }> = {
    dashboard: {
      title: "Tổng quan",
      desc: "Doanh thu, vé bán và tỷ lệ check-in theo thời gian thực",
    },
    events: {
      title: "Sự kiện",
      desc: "Tạo chương trình mới và quản lý trạng thái on-chain",
    },
    tickets: {
      title: "Vé đã bán",
      desc: "Danh sách vé, check-in thủ công và tra cứu ví",
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-6 backdrop-blur-md sm:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold tracking-tight whitespace-nowrap">
                {titles[activeTab].title}
              </h1>
              {lastUpdated && (
                <span className="hidden rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums lg:inline">
                  Live · {lastUpdated}
                </span>
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
              onClick={() => void fetchTickets(false)}
              title="Làm mới dữ liệu"
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
        {isLoading && (
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Đang đồng bộ dữ liệu vé…
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Doanh thu",
                  value: formatVND(totalRevenue),
                  icon: <TrendingUp className="size-4 text-primary" />,
                },
                {
                  label: "Vé đã bán",
                  value: `${tickets.length}`,
                  icon: <Ticket className="size-4 text-primary" />,
                },
                {
                  label: "Đã check-in",
                  value: `${checkedInCount} / ${tickets.length}`,
                  icon: <UserCheck className="size-4 text-success" />,
                },
                {
                  label: "Sự kiện",
                  value: `${events.length}`,
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
                    {checkedInCount} vé đã vào cổng · {checkInRate}% tổng vé
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-success transition-all duration-500"
                      style={{ width: `${checkInRate}%` }}
                    />
                  </div>
                  <div className="mt-6 space-y-3">
                    {tickets.slice(0, 5).map((t) => (
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
                            "rounded-md shrink-0",
                            t.isCheckedIn
                              ? "bg-success/15 text-success"
                              : "bg-amber-500/15 text-amber-400",
                          )}
                        >
                          {t.isCheckedIn ? "Đã vào" : "Chưa vào"}
                        </Badge>
                      </div>
                    ))}
                    {tickets.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Chưa có vé nào. Tạo vé demo từ trang Vé của tôi.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="border-b border-border">
                  <CardTitle>Sự kiện đang chạy</CardTitle>
                  <CardDescription>Theo dõi cung cầu vé</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {events.map((evt) => {
                    const soldPct = Math.min(
                      100,
                      Math.round((evt.soldTickets / evt.totalTickets) * 100),
                    );
                    return (
                      <div key={evt.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {evt.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {evt.soldTickets}/{evt.totalTickets} vé · {soldPct}%
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
                  Khởi tạo chương trình và liên kết Merkle Tree / Program Devnet
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <form
                  onSubmit={handleCreateEvent}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tên sự kiện *
                    </label>
                    <Input
                      required
                      placeholder="Concert Anh Trai Vượt Ngàn Chông Gai 2026"
                      value={newEvent.name}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Địa điểm
                    </label>
                    <Input
                      placeholder="SVĐ Mỹ Đình"
                      value={newEvent.location}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, location: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Ngày diễn ra
                    </label>
                    <Input
                      placeholder="26/08/2026"
                      value={newEvent.date}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Giá vé (VNĐ) *
                    </label>
                    <Input
                      type="number"
                      required
                      placeholder="1500000"
                      value={newEvent.priceVnd}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, priceVnd: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tổng cung *
                    </label>
                    <Input
                      type="number"
                      required
                      placeholder="100"
                      value={newEvent.totalTickets}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          totalTickets: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      URL poster
                    </label>
                    <Input
                      type="url"
                      placeholder="https://…"
                      value={newEvent.posterUrl}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, posterUrl: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      <Plus className="size-3.5" />
                      {isSubmitting ? "Đang tạo…" : "Tạo sự kiện"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {events.map((evt) => (
                <Card key={evt.id} className="overflow-hidden p-0 gap-0">
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={evt.posterUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                      <StatusBadge status={evt.status} />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {evt.id}
                      </span>
                    </div>
                  </div>
                  <CardContent className="space-y-3 p-4">
                    <div>
                      <h3 className="font-medium leading-snug">{evt.name}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        {evt.location} · {evt.date}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Giá niêm yết</span>
                      <span className="font-semibold text-primary">
                        {formatVND(evt.priceVnd)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Đã bán</span>
                      <span>
                        {evt.soldTickets}/{evt.totalTickets}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <select
                        value={evt.status}
                        onChange={(e) =>
                          handleEventStatusChange(
                            evt.id,
                            e.target.value as EventItem["status"],
                          )
                        }
                        className="h-8 flex-1 rounded-lg border border-input bg-input/30 px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="active">Đang mở bán</option>
                        <option value="upcoming">Sắp diễn ra</option>
                        <option value="ended">Đã kết thúc</option>
                      </select>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => handleDeleteEvent(evt.id, evt.name)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tickets" && (
          <Card className="gap-0 overflow-hidden p-0">
            <CardHeader className="border-b border-border py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Danh sách vé</CardTitle>
                  <CardDescription>
                    {filteredTickets.length} kết quả
                  </CardDescription>
                </div>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên, email, ví, mã vé…"
                  className="max-w-xs"
                />
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
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
                  {filteredTickets.map((t) => (
                    <tr
                      key={t.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">#{t.id}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {t.ownerWallet
                            ? `${t.ownerWallet.slice(0, 4)}…${t.ownerWallet.slice(-4)}`
                            : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {t.ownerName ?? "—"}
                        </p>
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
                            t.isCheckedIn
                              ? "bg-success/15 text-success"
                              : "bg-amber-500/15 text-amber-400",
                          )}
                        >
                          {t.isCheckedIn ? "Đã check-in" : "Chưa vào"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {!t.isCheckedIn && (
                            <Button
                              size="xs"
                              onClick={() => void handleQuickCheckIn(t.id)}
                            >
                              Check-in
                            </Button>
                          )}
                          {t.mintAddress && !t.mintAddress.startsWith("demo") && (
                            <a
                              href={`https://explorer.solana.com/address/${t.mintAddress}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="icon-xs">
                                <ExternalLink className="size-3.5" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
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
      </main>
    </div>
  );
}
