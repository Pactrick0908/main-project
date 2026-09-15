import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DynamicQRModal from "@/pages/client/ticket/DynamicQRModal";
import { clearSession, getStoredUser, getToken } from "@/api/auth.api";
import { ticketApi, type TicketDto } from "@/api/ticket.api";

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TicketDto | null>(null);
  const [issuing, setIssuing] = useState(false);

  const load = useCallback(async () => {
    if (!getToken()) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await ticketApi.listMine();
      setTickets(res.data.tickets);
    } catch (err: any) {
      setError(err?.message ?? "Không tải được vé");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDemo = async () => {
    setIssuing(true);
    try {
      const res = await ticketApi.issueDemo();
      await load();
      setSelected(res.data.ticket);
    } catch (err: any) {
      alert(err?.message ?? "Cấp vé demo thất bại");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">
      <header className="border-b border-white/10 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <Link to="/" className="text-sm text-white/50 hover:text-white">
              ← Trang chủ
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Vé của tôi
            </h1>
            {user && (
              <p className="text-sm text-white/50">
                {user.name} · {user.walletAddress.slice(0, 4)}…
                {user.walletAddress.slice(-4)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleDemo()}
              disabled={issuing}
              className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
            >
              {issuing ? "Đang cấp…" : "+ Vé demo"}
            </button>
            <button
              type="button"
              onClick={() => {
                clearSession();
                navigate("/login");
              }}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        {loading ? (
          <p className="text-white/50">Đang tải…</p>
        ) : error ? (
          <div className="rounded-xl bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
            <p className="text-lg text-white/70">Chưa có vé nào</p>
            <p className="mt-2 text-sm text-white/40">
              Bấm &quot;+ Vé demo&quot; để tạo vé test Dynamic QR
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {tickets.map((t) => (
              <li
                key={t.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                {t.event.bannerUrl && (
                  <img
                    src={t.event.bannerUrl}
                    alt=""
                    className="h-36 w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-medium leading-snug">
                      {t.event.title}
                    </h2>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-xs ${
                        t.isCheckedIn
                          ? "bg-amber-500/20 text-amber-200"
                          : "bg-emerald-500/20 text-emerald-200"
                      }`}
                    >
                      {t.isCheckedIn ? "Đã check-in" : "Hợp lệ"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/55">
                    {t.zoneName}
                    {t.seatLabel ? ` · ${t.seatLabel}` : ""} ·{" "}
                    {formatVND(t.price)}
                  </p>
                  <button
                    type="button"
                    disabled={t.isCheckedIn}
                    onClick={() => setSelected(t)}
                    className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
                  >
                    {t.isCheckedIn ? "Vé đã dùng" : "Hiện mã QR check-in"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {selected && (
        <DynamicQRModal
          ticket={selected}
          onClose={() => setSelected(null)}
          onCheckedIn={() => {
            setSelected(null);
            void load();
          }}
        />
      )}
    </div>
  );
}
