import { useCallback, useEffect, useState } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminApi } from "@/api/admin.api";
import type { TicketDto } from "@/api/ticket.api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "cn";
import { formatVND } from "@/pages/admin/adminShared";
import { AdminPageShell } from "@/layouts/admin/HeaderAdmin";
import { toast } from "@/lib/toast";

export default function TicketPage() {
  const { isAuthenticated } = useAuth();

  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const tk = await adminApi.listTickets(searchQuery || undefined);
      setTickets(tk.data.tickets);
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

  const handleCheckIn = async (ticketId: number) => {
    try {
      await adminApi.checkIn(ticketId);
      toast.success(`Đã check-in vé #${ticketId}`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check-in thất bại");
    }
  };

  const handleRevoke = async (ticketId: number) => {
    const reason = prompt("Lý do khóa vé (gian lận / hủy)?") ?? "";
    if (reason === null) return;
    try {
      await adminApi.revoke(ticketId, reason || "admin");
      toast.success(`Đã khóa vé #${ticketId}`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Khóa vé thất bại");
    }
  };

  return (
    <AdminPageShell
      title="Vé đã bán"
      description="Tìm kiếm, check-in thủ công và khóa vé gian lận"
      lastUpdated={lastUpdated}
      loading={loading}
      error={error}
      onRefresh={() => void refresh()}
    >
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
    </AdminPageShell>
  );
}
