import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Lock,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { MarketplaceTicket } from "./marketplace.data";
import {
  marketplaceApi,
  type P2PTradeCreateResult,
} from "@/api/marketplace.api";
import { ticketApi } from "@/api/ticket.api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import VietQRModal from "@/pages/client/event/VietQRModal";

interface BuyP2PModalProps {
  ticket: MarketplaceTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchased?: () => void;
}

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

export default function BuyP2PModal({
  ticket,
  isOpen,
  onClose,
  onPurchased,
}: BuyP2PModalProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [trade, setTrade] = useState<P2PTradeCreateResult | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTrade(null);
      setBusy(false);
    }
  }, [isOpen]);

  if (!ticket) return null;

  const listingId = ticket.listingId ?? ticket.id;

  const closeAll = () => {
    setTrade(null);
    onClose();
  };

  const handleConfirmBuy = async () => {
    if (!isAuthenticated) {
      toast.error("Đăng nhập để mua vé P2P");
      return;
    }
    setBusy(true);
    try {
      const res = await marketplaceApi.createTrade(listingId);
      setTrade(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không tạo được giao dịch");
    } finally {
      setBusy(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!trade) return;
    try {
      await ticketApi.completePayOSOrder(trade.payosOrderCode);
      for (let i = 0; i < 10; i++) {
        const check = await marketplaceApi.getTradeByCode(trade.payosOrderCode);
        const status = check.data?.trade?.escrowStatus;
        if (status === "HELD" || status === "RELEASED") break;
        await new Promise((r) => setTimeout(r, 400));
      }
      toast.success("Thanh toán ký quỹ thành công — vé đã vào tài khoản của bạn");
      onPurchased?.();
      closeAll();
      navigate(`/my-tickets?p2p=success&tradeCode=${trade.payosOrderCode}`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Giả lập chuyển khoản thất bại — kiểm tra backend",
      );
    }
  };

  return (
    <>
      <Dialog open={isOpen && !trade} onOpenChange={onClose}>
        <DialogContent className="max-w-md border-zinc-800 bg-[#0E0F16] text-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Mua Vé P2P Ký Quỹ Bảo Đảm An Toàn
            </DialogTitle>
          </DialogHeader>

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
                  {ticket.date.split("·")[0]?.trim()}
                </span>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-black/30 p-2.5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400">
                    Vị trí chỗ ngồi:
                  </div>
                  <div className="font-bold text-[#F97316] text-xs mt-0.5">
                    {ticket.seatZone}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-zinc-800">
                <div>
                  <span className="text-zinc-400">Giá thanh toán:</span>
                  <div className="text-[10px] text-zinc-500 line-through">
                    Gốc: {ticket.originalPrice}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-400">
                    {ticket.passPrice}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1 text-zinc-300">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs">
                <Lock className="h-3.5 w-3.5" />
                Cơ chế bảo vệ người mua (Ký quỹ an toàn)
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-300">
                Bấm thanh toán để hiện mã VietQR. Nút demo coi như đã chuyển
                khoản — vé chuyển sang tài khoản bạn ngay.
              </p>
            </div>

            <div className="pt-2">
              {!isAuthenticated ? (
                <Link to="/login" onClick={onClose}>
                  <Button className="w-full rounded-xl bg-[#F97316] hover:bg-[#ea6d0e] text-white font-bold py-3 text-xs h-auto">
                    Đăng nhập để mua vé
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => void handleConfirmBuy()}
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#ea6d0e] text-white font-bold py-3 text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer h-auto"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Thanh toán VietQR</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
              <p className="mt-2 text-center text-[10px] text-zinc-500">
                Hỗ trợ thanh toán bảo mật qua chuyển khoản VietQR
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VietQRModal
        isOpen={Boolean(isOpen && trade)}
        orderInfo={
          trade
            ? {
                orderId: trade.tradeId,
                orderCode: trade.payosOrderCode,
                totalAmount: trade.amount,
                checkoutUrl: trade.checkoutUrl,
                qrCode: trade.qrCode,
              }
            : null
        }
        onClose={closeAll}
        onSimulateSuccess={() => void handleSimulatePayment()}
        formatVND={formatVND}
      />
    </>
  );
}
