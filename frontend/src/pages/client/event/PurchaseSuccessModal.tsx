import { CheckCircle2, QrCode, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  eventTitle: string;
  ticketInfo: {
    zone: string;
    qty: number;
    total: number;
    seats?: string[];
  } | null;
  onClose: () => void;
  formatVND: (amount: number) => string;
}

export default function PurchaseSuccessModal({
  isOpen,
  eventTitle,
  ticketInfo,
  onClose,
  formatVND,
}: PurchaseSuccessModalProps) {
  const navigate = useNavigate();

  if (!isOpen || !ticketInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
      {/* Modal Box gọn gàng: max-w-[360px] */}
      <div className="relative w-full max-w-[360px] rounded-2xl border border-zinc-800 bg-[#12131A] p-4 sm:p-5 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          title="Đóng"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2.5">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <h2 className="text-base font-bold text-white">Mua vé thành công!</h2>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Vé đã vào ví của bạn — mở &quot;Vé của tôi&quot; để lấy mã QR check-in
        </p>

        <div className="my-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-left text-[11px] space-y-1.5">
          <div className="flex justify-between">
            <span className="text-zinc-400">Sự kiện:</span>
            <span className="font-semibold text-white line-clamp-1">{eventTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Hạng vé:</span>
            <span className="font-semibold text-[#F97316]">{ticketInfo.zone}</span>
          </div>
          {ticketInfo.seats && ticketInfo.seats.length > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-400">Vị trí ghế:</span>
              <span className="font-bold text-amber-400">
                {ticketInfo.seats.join(", ")}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-400">Số lượng:</span>
            <span className="font-mono text-white">{ticketInfo.qty} vé</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Tổng tiền:</span>
            <span className="font-bold text-emerald-400">{formatVND(ticketInfo.total)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate("/my-tickets")}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#F97316] hover:bg-[#ea6d0e] py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <QrCode className="h-3.5 w-3.5" />
            Xem ví &amp; lấy Dynamic QR
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
