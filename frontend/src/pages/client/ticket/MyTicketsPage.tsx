import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DynamicQRModal from "@/pages/client/ticket/DynamicQRModal";
import { clearSession, getStoredUser, getToken } from "@/api/auth.api";
import { ticketApi, type TicketDto } from "@/api/ticket.api";

// Sub-components
import TicketHeader from "./TicketHeader";
import TicketCard from "./TicketCard";
import EmptyTicketState from "./EmptyTicketState";

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

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">
      {/* 1. Header */}
      <TicketHeader
        user={user}
        issuing={issuing}
        onIssueDemo={handleDemo}
        onLogout={handleLogout}
      />

      {/* 2. Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        {loading ? (
          <p className="text-white/50">Đang tải…</p>
        ) : error ? (
          <div className="rounded-xl bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyTicketState />
        ) : (
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

      {/* 3. Modal Dynamic QR 60s */}
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
