import { QrCode, X, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface VietQRModalProps {
  isOpen: boolean;
  orderInfo: {
    orderId: number;
    orderCode: number;
    totalAmount: number;
    checkoutUrl: string;
    qrCode: string;
  } | null;
  onClose: () => void;
  onSimulateSuccess: () => void;
  formatVND: (amount: number) => string;
}

export default function VietQRModal({
  isOpen,
  orderInfo,
  onClose,
  onSimulateSuccess,
  formatVND,
}: VietQRModalProps) {
  if (!isOpen || !orderInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
      {/* Modal Box gọn gàng: max-w-[360px] */}
      <div className="relative w-full max-w-[360px] rounded-2xl border border-zinc-800 bg-[#12131A] p-4 sm:p-5 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Nút X đóng góc trên */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          title="Đóng"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <QrCode className="h-4 w-4" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white leading-tight">Thanh toán VietQR</h3>
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Chờ quét mã…
            </span>
          </div>
        </div>

        {/* Khung chứa mã QR VietQR (size gọn 155px) */}
        <div className="my-3 flex flex-col items-center justify-center rounded-xl bg-white p-2.5 shadow-inner">
          {orderInfo.qrCode ? (
            <QRCodeSVG
              value={orderInfo.qrCode}
              size={155}
              level="M"
              includeMargin={false}
            />
          ) : (
            <div className="h-36 w-36 flex items-center justify-center bg-zinc-100 text-zinc-400 text-xs">
              Đang tải QR...
            </div>
          )}
          <div className="mt-1.5 text-center text-zinc-700 text-[10px] font-semibold">
            Napas247 · Quét bằng App Ngân Hàng / MoMo
          </div>
        </div>

        {/* Chi tiết đơn thanh toán ngắn gọn */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-left text-[11px] space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-400">Mã đơn:</span>
            <span className="font-mono font-bold text-white">#{orderInfo.orderCode}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-zinc-400">Số tiền:</span>
            <span className="font-extrabold text-[#F97316] text-xs">
              {formatVND(orderInfo.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Nội dung:</span>
            <span className="font-mono text-emerald-400 font-bold">
              VE{orderInfo.orderCode}
            </span>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="mt-3 flex flex-col gap-2">
          {orderInfo.checkoutUrl && (
            <a
              href={orderInfo.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-bold text-white transition-colors"
            >
              Mở trang PayOS
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          <button
            type="button"
            onClick={onSimulateSuccess}
            className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 py-2 text-[11px] font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
          >
            ⚡ Đã chuyển khoản (Demo Test)
          </button>
        </div>
      </div>
    </div>
  );
}
