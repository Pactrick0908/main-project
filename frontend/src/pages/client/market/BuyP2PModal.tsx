import { ShieldCheck, ArrowRight, CheckCircle2, UserCheck, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { MarketplaceTicket } from "./marketplace.data";

interface BuyP2PModalProps {
  ticket: MarketplaceTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBuy: () => void;
  isSuccess: boolean;
}

export default function BuyP2PModal({
  ticket,
  isOpen,
  onClose,
  onConfirmBuy,
  isSuccess,
}: BuyP2PModalProps) {
  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-zinc-800 bg-[#0E0F16] text-white p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Mua Vé P2P Ký Quỹ Bảo Đảm An Toàn
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="text-base font-bold text-white">Thanh toán ký quỹ thành công!</p>
            <p className="mt-2 text-xs text-zinc-400 max-w-xs leading-relaxed">
              Vé đã được chuyển giao vào mục &quot;Vé của tôi&quot;. Khoản thanh toán ({ticket.passPrice}) được tạm giữ an toàn qua cổng trung gian và chỉ giải ngân cho người bán <span className="text-white font-semibold">{ticket.seller}</span> sau khi bạn check-in thành công tại sự kiện.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4 text-xs">
            {/* Event & Seller Card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
              <div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Sự kiện &amp; Người bán
                </div>
                <div className="font-bold text-white text-sm mt-0.5">{ticket.title}</div>
              </div>

              {/* Seller details */}
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/20 text-[#F97316] font-bold text-[10px]">
                    {ticket.seller.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 font-semibold text-white">
                      <span>{ticket.seller}</span>
                      <UserCheck className="h-3 w-3 text-emerald-400" />
                    </div>
                    <div className="text-[10px] text-zinc-400">Người bán đã xác minh vé chính chủ</div>
                  </div>
                </div>

                <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                  {ticket.date.split("·")[0].trim()}
                </span>
              </div>

              {/* Zone */}
              <div className="rounded-lg border border-zinc-800 bg-black/30 p-2.5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400">Vị trí chỗ ngồi:</div>
                  <div className="font-bold text-[#F97316] text-xs mt-0.5">{ticket.seatZone}</div>
                </div>
              </div>

              {/* Price summary */}
              <div className="flex justify-between items-baseline pt-2 border-t border-zinc-800">
                <div>
                  <span className="text-zinc-400">Giá thanh toán:</span>
                  <div className="text-[10px] text-zinc-500 line-through">Gốc: {ticket.originalPrice}</div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-400">
                    {ticket.passPrice}
                  </span>
                </div>
              </div>
            </div>

            {/* Escrow Guarantee Box */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1 text-zinc-300">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs">
                <Lock className="h-3.5 w-3.5" />
                Cơ chế bảo vệ người mua (Ký quỹ an toàn)
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-300">
                Khoản thanh toán của bạn sẽ được giữ an toàn tại cổng trung gian. Tiền <strong className="text-white">chưa chuyển ngay</strong> cho người bán mà được bảo lưu an toàn cho đến khi mã Dynamic QR của bạn được quét check-in hợp lệ tại cổng.
              </p>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <Button
                onClick={onConfirmBuy}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#ea6d0e] text-white font-bold py-3 text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer h-auto"
              >
                <span>Xác nhận mua &amp; Nạp tiền ký quỹ</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="mt-2 text-center text-[10px] text-zinc-500">
                Hỗ trợ thanh toán bảo mật qua chuyển khoản VietQR &amp; Thẻ ngân hàng
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
