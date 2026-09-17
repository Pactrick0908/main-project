import { Link } from "react-router-dom";
import { Ticket, QrCode, Check, Sparkles } from "lucide-react";
import type { EventZone } from "@/data/events.data";
import type { AuthUser } from "@/api/auth.api";

interface EventCheckoutBoxProps {
  selectedZone: EventZone;
  quantity: number;
  totalPriceVND: number;
  formatVND: (amount: number) => string;
  isProcessing: boolean;
  onBuyTicket: () => void;
  isAuthenticated: boolean;
  user: AuthUser | null;
}

export default function EventCheckoutBox({
  selectedZone,
  quantity,
  totalPriceVND,
  formatVND,
  isProcessing,
  onBuyTicket,
  isAuthenticated,
  user,
}: EventCheckoutBoxProps) {
  return (
    <div className="sticky top-20 rounded-2xl border border-zinc-800 bg-[#12131A] p-5 sm:p-6 shadow-2xl space-y-5">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Ticket className="h-4 w-4 text-[#F97316]" />
          Tóm tắt đơn mua
        </h3>
        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
          Còn vé
        </span>
      </div>

      {/* Thông tin vé đang chọn */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2 text-xs">
        <div className="flex justify-between text-zinc-400">
          <span>Hạng vé:</span>
          <span className="font-semibold text-white">{selectedZone.name}</span>
        </div>
        <div className="flex justify-between text-zinc-400">
          <span>Số lượng:</span>
          <span className="font-mono text-white">{quantity} vé</span>
        </div>
        <div className="flex justify-between text-zinc-400">
          <span>Đơn giá:</span>
          <span className="font-mono text-zinc-300">
            {formatVND(selectedZone.price)}
          </span>
        </div>
      </div>

      {/* Chọn phương thức thanh toán */}
      <div>
        <label className="text-xs font-semibold text-zinc-400 block mb-2">
          Phương thức thanh toán
        </label>
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                Chuyển khoản VietQR / MoMo
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="text-[11px] text-zinc-400">
                Quét mã QR ngân hàng hoặc ví điện tử
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chi tiết chi phí */}
      <div className="space-y-2 border-t border-zinc-800 pt-3 text-xs">
        <div className="flex justify-between text-zinc-400">
          <span>Tạm tính ({quantity} vé):</span>
          <span className="font-mono text-zinc-200">
            {formatVND(totalPriceVND)}
          </span>
        </div>
        <div className="flex justify-between text-zinc-400">
          <span>Phí dịch vụ:</span>
          <span className="text-emerald-400 font-semibold">Miễn phí</span>
        </div>
        <div className="flex justify-between items-baseline border-t border-zinc-800/80 pt-2.5">
          <span className="text-sm font-bold text-white">Tổng thanh toán:</span>
          <div className="text-right">
            <div className="text-lg font-black text-[#F97316]">
              {formatVND(totalPriceVND)}
            </div>
          </div>
        </div>
      </div>

      {/* Nút Mua Vé CTA */}
      <button
        type="button"
        onClick={onBuyTicket}
        disabled={isProcessing}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#ea6d0e] py-3.5 text-sm font-bold text-white transition-all shadow-[0_4px_20px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isProcessing ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Đang tạo đơn VietQR…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Xác nhận mua vé ngay
          </>
        )}
      </button>

      {/* Auth Notice */}
      {!isAuthenticated && (
        <p className="text-[11px] text-center text-zinc-500">
          Bạn chưa đăng nhập. Nhấn mua sẽ chuyển hướng đến{" "}
          <Link to="/login" className="text-[#F97316] hover:underline">
            Đăng nhập
          </Link>
        </p>
      )}
      {isAuthenticated && user && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Vé sẽ được gửi vào ví ngầm:{" "}
          <span className="font-mono text-zinc-300">
            {user.walletAddress?.slice(0, 4)}...{user.walletAddress?.slice(-4)}
          </span>
        </div>
      )}
    </div>
  );
}
