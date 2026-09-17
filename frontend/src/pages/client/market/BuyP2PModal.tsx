import { ShieldCheck, ArrowRight, CheckCircle2, UserCheck, Lock, Loader2 } from "lucide-react";
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
  isLoading?: boolean;
  paymentInfo?: {
    qrCode: string;
    checkoutUrl: string;
    amount: number;
    tradeId: number;
    payosOrderCode?: number;
  } | null;
}

export default function BuyP2PModal({
  ticket,
  isOpen,
  onClose,
  onConfirmBuy,
  isSuccess,
  isLoading,
  paymentInfo,
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
            <p className="text-base font-bold text-white">
              Thanh toán ký quỹ thành công!
            </p>
            <p className="mt-2 text-xs text-zinc-400 max-w-xs leading-relaxed">
              Vé đã được chuyển giao vào mục &quot;Vé của tôi&quot;. Khoản thanh
              toán ({ticket.passPrice}) được tạm giữ và chỉ giải ngân cho{" "}
              <span className="text-white font-semibold">{ticket.seller}</span>{" "}
              sau khi bạn check-in thành công tại sự kiện.
            </p>
          </div>
        ) : paymentInfo ? (
          <div className="mt-4 space-y-4 text-center">
            <p className="text-sm font-semibold text-white">
              Quét VietQR để ký quỹ{" "}
              {new Intl.NumberFormat("vi-VN").format(paymentInfo.amount)}đ
            </p>
            {paymentInfo.qrCode?.startsWith("http") ||
            paymentInfo.qrCode?.startsWith("data:") ? (
              <img
                src={paymentInfo.qrCode}
                alt="VietQR"
                className="mx-auto h-48 w-48 rounded-xl bg-white p-2"
              />
            ) : (
              <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-[10px] text-zinc-400 break-all max-h-32 overflow-auto">
                {paymentInfo.qrCode}
              </div>
            )}
            <a
              href={paymentInfo.checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-xs text-[#F97316] underline"
            >
              Mở trang thanh toán PayOS
            </a>
            <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Đang chờ xác nhận thanh toán…
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs border-zinc-700"
              onClick={async () => {
                const orderCode = paymentInfo.payosOrderCode;
                if (!orderCode) return;
                try {
                  await fetch("/api/v1/webhook/payos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      code: "00",
                      desc: "success",
                      success: true,
                      data: { orderCode, amount: paymentInfo.amount },
                    }),
                  });
                } catch {
                  /* ignore */
                }
              }}
            >
              (Dev) Giả lập thanh toán ký quỹ thành công
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-4 text-xs">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
              <div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Sự kiện &amp; Người bán
                </div>
                <div className="font-bold text-white text-sm mt-0.5">
                  {ticket.title}
                </div>
              </div>

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
                    <div className="text-[10px] text-zinc-400">
                      Người bán đã xác minh vé chính chủ
                    </div>
                  </div>
                </div>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                  {ticket.date.split("·")[0].trim()}
                </span>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-black/30 p-2.5 flex items-center justify-between">
                <span className="text-zinc-400">Hạng / ghế</span>
                <span className="font-semibold text-white">{ticket.seatZone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Giá gốc</span>
                <span className="line-through text-zinc-500">
                  {ticket.originalPrice}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-white">Giá pass</span>
                <span className="font-bold text-[#F97316]">{ticket.passPrice}</span>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1 text-zinc-300">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs">
                <Lock className="h-3.5 w-3.5" />
                Cơ chế bảo vệ người mua (Ký quỹ an toàn)
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-300">
                Tiền được giữ tại cổng trung gian và chỉ giải ngân cho người bán
                sau khi Dynamic QR được quét check-in hợp lệ.
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={onConfirmBuy}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#ea6d0e] text-white font-bold py-3 text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer h-auto"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Xác nhận mua &amp; Nạp tiền ký quỹ</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
