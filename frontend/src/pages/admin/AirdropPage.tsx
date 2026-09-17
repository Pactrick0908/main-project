import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminApi, type AdminEvent } from "@/api/admin.api";
import { useAuth } from "@/context/AuthContext";
import { formatVND } from "@/pages/admin/adminShared";
import { AdminPageShell } from "@/layouts/admin/HeaderAdmin";

export default function AirdropPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      const ev = await adminApi.listEvents();
      setEvents(ev.data.events);
      setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu admin");
    } finally {
      setLoading(false);
    }
  }, []);

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
      navigate("/admin/tickets");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cấp vé thất bại");
    } finally {
      setAirdropBusy(false);
    }
  };

  return (
    <AdminPageShell
      title="Cấp vé mời"
      description="Airdrop vé đặc biệt theo email hoặc địa chỉ ví"
      lastUpdated={lastUpdated}
      loading={loading}
      error={error}
      onRefresh={() => void refresh()}
    >
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
    </AdminPageShell>
  );
}
