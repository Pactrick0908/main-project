import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2 } from "lucide-react";
import { ticketApi, type QrPayload, type TicketDto } from "../../../api/ticket.api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/lib/toast";

type Props = {
  ticket: TicketDto;
  onClose: () => void;
  onCheckedIn?: (ticket: TicketDto) => void;
};

export default function DynamicQRModal({ ticket, onClose, onCheckedIn }: Props) {
  const [payload, setPayload] = useState<QrPayload | null>(null);
  const [ttlMs, setTtlMs] = useState(60_000);
  const [remaining, setRemaining] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedInTicket, setCheckedInTicket] = useState<TicketDto | null>(
    ticket.isCheckedIn ? ticket : null,
  );
  const handledRef = useRef(false);

  const finishCheckedIn = useCallback(
    (t: TicketDto) => {
      if (handledRef.current) return;
      handledRef.current = true;
      setCheckedInTicket(t);
      setPayload(null);
      toast.success("Check-in thành công — vé đã được sử dụng");
      window.setTimeout(() => {
        onCheckedIn?.(t);
        onClose();
      }, 900);
    },
    [onCheckedIn, onClose],
  );

  const refreshQr = useCallback(async () => {
    if (handledRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ticketApi.issueQr(ticket.id);
      if (res.data.ticket.isCheckedIn) {
        finishCheckedIn(res.data.ticket);
        return;
      }
      setPayload(res.data.payload);
      setTtlMs(res.data.ttlMs);
    } catch (err: any) {
      const msg = String(err?.message ?? "");
      // Backend trả 409 khi vé đã check-in
      if (
        err?.status === 409 ||
        /check-in|đã được check-in|đã check-in/i.test(msg)
      ) {
        try {
          const st = await ticketApi.getStatus(ticket.id);
          finishCheckedIn(st.data.ticket);
          return;
        } catch {
          finishCheckedIn({ ...ticket, isCheckedIn: true, status: "checked_in" });
          return;
        }
      }
      setError(msg || "Không tạo được mã QR");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [ticket, finishCheckedIn]);

  useEffect(() => {
    void refreshQr();
  }, [refreshQr]);

  // Poll trạng thái: cổng quét thành công → hủy QR + đóng modal
  useEffect(() => {
    if (checkedInTicket || handledRef.current) return;
    const id = window.setInterval(() => {
      void (async () => {
        try {
          const res = await ticketApi.getStatus(ticket.id);
          if (res.data.ticket.isCheckedIn) {
            finishCheckedIn(res.data.ticket);
          }
        } catch {
          /* ignore transient poll errors */
        }
      })();
    }, 1200);
    return () => window.clearInterval(id);
  }, [ticket.id, checkedInTicket, finishCheckedIn]);

  useEffect(() => {
    if (!payload || checkedInTicket) return;

    const tick = () => {
      const left = Math.max(0, Math.ceil((payload.expiresAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        void refreshQr();
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [payload, refreshQr, checkedInTicket]);

  const qrValue = payload ? JSON.stringify(payload) : "";
  const progress = payload ? Math.max(0, (payload.expiresAt - Date.now()) / ttlMs) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#0f1419] text-white shadow-2xl ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-400">
              Dynamic QR · 60s
            </p>
            <h2 className="mt-1 text-lg font-semibold">{ticket.event.title}</h2>
            <p className="text-sm text-white/60">
              {ticket.zoneName}
              {ticket.seatLabel ? ` · Ghế ${ticket.seatLabel}` : ""} · Vé #
              {ticket.id}
            </p>
          </div>
          {!checkedInTicket && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              Đóng
            </button>
          )}
        </div>

        <div className="flex flex-col items-center px-5 py-6">
          {checkedInTicket ? (
            <div className="flex w-full flex-col items-center gap-3 rounded-xl bg-emerald-500/15 px-4 py-8 text-center text-emerald-100">
              <CheckCircle2 className="size-12 text-emerald-400" />
              <p className="text-base font-semibold">Check-in thành công</p>
              <p className="text-sm text-emerald-200/80">
                Vé đã được sử dụng — đang đóng mã QR…
              </p>
              {checkedInTicket.checkedInAt && (
                <p className="text-xs text-emerald-200/60">
                  {new Date(checkedInTicket.checkedInAt).toLocaleString("vi-VN")}
                </p>
              )}
            </div>
          ) : error ? (
            <div className="w-full rounded-xl bg-red-500/15 px-4 py-6 text-center text-red-200">
              {error}
              <button
                type="button"
                onClick={() => void refreshQr()}
                className="mt-3 block w-full rounded-lg bg-white/10 py-2 text-sm"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-white p-4">
                {loading && !payload ? (
                  <LoadingSpinner
                    label="Đang tạo mã…"
                    className="h-56 w-56 min-h-0"
                  />
                ) : (
                  <QRCodeSVG
                    value={qrValue}
                    size={300}
                    level="L"
                    marginSize={4}
                  />
                )}
              </div>

              <div className="mt-5 w-full">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-white/60">Mã đổi sau</span>
                  <span className="font-mono text-emerald-300">{remaining}s</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-[width] duration-200"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>

              <p className="mt-4 text-center text-xs leading-relaxed text-white/45">
                Đưa mã này ra cổng trong vòng 1 phút. Sau khi quét thành công, vé
                sẽ tự vô hiệu và màn hình QR đóng lại.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
