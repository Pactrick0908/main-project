import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ticketApi, type QrPayload, type TicketDto } from "../../../api/ticket.api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type Props = {
  ticket: TicketDto;
  onClose: () => void;
  onCheckedIn?: () => void;
};

export default function DynamicQRModal({ ticket, onClose, onCheckedIn }: Props) {
  const [payload, setPayload] = useState<QrPayload | null>(null);
  const [ttlMs, setTtlMs] = useState(60_000);
  const [remaining, setRemaining] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshQr = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ticketApi.issueQr(ticket.id);
      setPayload(res.data.payload);
      setTtlMs(res.data.ttlMs);
      if (res.data.ticket.isCheckedIn) {
        onCheckedIn?.();
      }
    } catch (err: any) {
      setError(err?.message ?? "Không tạo được mã QR");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [ticket.id, onCheckedIn]);

  useEffect(() => {
    void refreshQr();
  }, [refreshQr]);

  useEffect(() => {
    if (!payload) return;

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
  }, [payload, refreshQr]);

  const qrValue = payload ? JSON.stringify(payload) : "";
  const progress = payload ? Math.max(0, (payload.expiresAt - Date.now()) / ttlMs) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#0f1419] text-white shadow-2xl ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-400">Dynamic QR · 60s</p>
            <h2 className="mt-1 text-lg font-semibold">{ticket.event.title}</h2>
            <p className="text-sm text-white/60">
              {ticket.zoneName}
              {ticket.seatLabel ? ` · Ghế ${ticket.seatLabel}` : ""} · Vé #{ticket.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            Đóng
          </button>
        </div>

        <div className="flex flex-col items-center px-5 py-6">
          {ticket.isCheckedIn ? (
            <div className="rounded-xl bg-amber-500/15 px-4 py-6 text-center text-amber-200">
              Vé đã check-in
              {ticket.checkedInAt
                ? ` lúc ${new Date(ticket.checkedInAt).toLocaleString("vi-VN")}`
                : ""}
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
                  <QRCodeSVG value={qrValue} size={224} level="M" includeMargin={false} />
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
                Đưa mã này ra cổng trong vòng 1 phút. Ảnh chụp màn hình cũ sẽ bị từ chối vì nonce
                hết hạn / đã dùng.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
