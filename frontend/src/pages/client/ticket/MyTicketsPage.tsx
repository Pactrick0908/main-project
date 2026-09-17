import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Wallet, RefreshCw, Loader2 } from "lucide-react";
import DynamicQRModal from "@/pages/client/ticket/DynamicQRModal";
import { clearSession, getStoredUser, getToken } from "@/api/auth.api";
import { ticketApi, type TicketDto } from "@/api/ticket.api";
import TicketHeader from "./TicketHeader";
import TicketCard from "./TicketCard";

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = getStoredUser();
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [walletSynced, setWalletSynced] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TicketDto | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState(
    user?.walletAddress ?? "",
  );

  const syncFromWallet = useCallback(async () => {
    if (!getToken()) {
      navigate("/login", { replace: true });
      return;
    }
    setSyncing(true);
    setError(null);
    try {
      const res = await ticketApi.listMine();
      setTickets(res.data.tickets);
      setWalletAddress(
        res.data.wallet?.address ?? user?.walletAddress ?? "",
      );
      setSyncedAt(
        res.data.wallet?.syncedAt ?? new Date().toISOString(),
      );
      setWalletSynced(true);
    } catch (err: any) {
      setError(err?.message ?? "Không đọc được vé từ ví");
      setWalletSynced(false);
    } finally {
      setSyncing(false);
    }
  }, [navigate, user?.walletAddress]);

  const urlOrderCode = searchParams.get("orderCode");
  const [storedOrderCode, setStoredOrderCode] = useState<string | null>(() => {
    try {
      return localStorage.getItem("pendingPayOSOrderCode");
    } catch {
      return null;
    }
  });
  const orderCodeParam = urlOrderCode || storedOrderCode;
  const cancelParam = searchParams.get("cancel");
  const statusParam = searchParams.get("status");
  const payosCodeParam = searchParams.get("code");
  const payosRedirectPaid =
    statusParam === "PAID" || payosCodeParam === "00";

  useEffect(() => {
    const cancelled =
      cancelParam === "true" ||
      statusParam === "CANCELLED" ||
      statusParam === "cancelled";

    if (!orderCodeParam || cancelled) {
      void syncFromWallet();
      return;
    }

    let stopped = false;
    const confirmPayOSReturn = async () => {
      setConfirmingPayment(true);
      setSyncing(true);
      setError(null);
      try {
        for (let i = 0; i < 20; i++) {
          if (stopped) return;
          const payosConfirmed =
            payosRedirectPaid ||
            (await ticketApi.getPayOSPaymentStatus(orderCodeParam)).data
              ?.paid;
          if (payosConfirmed) {
            await ticketApi.completePayOSOrder(orderCodeParam);
            const res = await ticketApi.getOrderStatus(orderCodeParam);
            if (res.data?.status === "PAID") {
              try {
                localStorage.removeItem("pendingPayOSOrderCode");
              } catch {
                /* ignore */
              }
              setStoredOrderCode(null);
              await syncFromWallet();
              setConfirmingPayment(false);
              setSearchParams({}, { replace: true });
              return;
            }
          }
          await new Promise((r) => setTimeout(r, 1500));
        }
        await syncFromWallet();
        setError(
          "Chưa nhận được xác nhận chuyển khoản từ PayOS. Nếu đã thanh toán, bấm Làm mới ví.",
        );
      } catch (err: any) {
        const message =
          err?.message ?? "Không xác nhận được thanh toán PayOS";
        await syncFromWallet();
        setError(message);
      } finally {
        if (!stopped) {
          setConfirmingPayment(false);
          setSyncing(false);
        }
      }
    };

    void confirmPayOSReturn();
    return () => {
      stopped = true;
    };
  }, [
    orderCodeParam,
    cancelParam,
    statusParam,
    payosRedirectPaid,
    setSearchParams,
    syncFromWallet,
  ]);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : "—";

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">
      <TicketHeader user={user} onLogout={handleLogout} />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8">
        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F97316]/15 text-[#F97316]">
                <Wallet className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">
                  Ví custodial Solana
                </p>
                <p className="mt-0.5 font-mono text-xs text-white/55">
                  {shortWallet}
                </p>
                <p className="mt-1 text-[11px] text-white/40">
                  {confirmingPayment
                    ? "Đang xác nhận thanh toán PayOS và cấp vé vào ví…"
                    : syncing
                    ? "Đang mở ví và lấy vé…"
                    : walletSynced
                      ? `Đã đồng bộ · ${tickets.length} vé trong ví${
                          syncedAt
                            ? ` · ${new Date(syncedAt).toLocaleTimeString("vi-VN")}`
                            : ""
                        }`
                      : "Chưa đồng bộ được ví"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  if (
                    orderCodeParam &&
                    cancelParam !== "true" &&
                    statusParam !== "CANCELLED" &&
                    statusParam !== "cancelled"
                  ) {
                    try {
                      const payos =
                        await ticketApi.getPayOSPaymentStatus(orderCodeParam);
                      if (payos.data?.paid || payosRedirectPaid) {
                        await ticketApi.completePayOSOrder(orderCodeParam);
                      }
                    } catch {
                      // vẫn đọc ví
                    }
                  }
                  await syncFromWallet();
                })();
              }}
              disabled={syncing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ea6d0e] disabled:opacity-60"
            >
              {syncing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {syncing ? "Đang đọc ví…" : "Làm mới ví"}
            </button>
          </div>
        </section>

        {confirmingPayment && (
          <p className="text-center text-sm text-emerald-300/80">
            Đang xác nhận thanh toán PayOS và cấp vé vào ví…
          </p>
        )}

        {syncing && !confirmingPayment && (
          <p className="text-center text-sm text-white/50">
            Đang mở ví và kéo vé xuống…
          </p>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {walletSynced && !syncing && !confirmingPayment && tickets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
            <p className="text-lg font-medium text-white/70">Ví chưa có vé</p>
            <p className="mt-1 text-sm text-white/40">
              Mua vé sự kiện từ trang chủ — sau thanh toán mã vé sẽ vào ví này.
            </p>
          </div>
        )}

        {walletSynced && tickets.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onSelect={setSelected}
                formatVND={formatVND}
              />
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
            void syncFromWallet();
          }}
        />
      )}
    </div>
  );
}
