import { ShieldCheck, Star, Clock, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";
import type { MarketplaceTicket } from "../marketplace.data";
import { Button } from "@/components/ui/button";

interface SellerOfferCardProps {
  ticket: MarketplaceTicket;
  onSelectBuy: (ticket: MarketplaceTicket) => void;
}

export default function SellerOfferCard({ ticket, onSelectBuy }: SellerOfferCardProps) {
  const origPriceNum = parseInt(ticket.originalPrice.replace(/\D/g, ""), 10) || 0;
  const passPriceNum = parseInt(ticket.passPrice.replace(/\D/g, ""), 10) || 0;
  const discountPercent =
    origPriceNum > passPriceNum && origPriceNum > 0
      ? Math.round(((origPriceNum - passPriceNum) / origNum(origPriceNum)) * 100)
      : 0;

  function origNum(n: number) {
    return n;
  }

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800 bg-[#12131A] p-5 transition-all duration-200 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/40">
      {/* Top row: Seller info & Zone */}
      <div>
        <div className="flex items-start justify-between gap-3">
          {/* Seller profile */}
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
              {ticket.sellerAvatar ? (
                <img
                  src={ticket.sellerAvatar}
                  alt={ticket.seller}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-bold text-xs text-[#F97316]">
                  {ticket.seller.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-white">
                  {ticket.seller}
                </span>
                {ticket.verified && (
                  <span title="Người bán đã xác thực danh tính & vé chính chủ" className="text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500/20" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                {ticket.sellerRating && (
                  <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                    <Star className="h-3 w-3 fill-amber-400" />
                    {ticket.sellerRating}
                  </span>
                )}
                {ticket.sellerSuccessCount && (
                  <span>· {ticket.sellerSuccessCount} đơn thành công</span>
                )}
              </div>
            </div>
          </div>

          {/* Time posted */}
          {ticket.createdAt && (
            <div className="flex items-center gap-1 text-[11px] text-zinc-500">
              <Clock className="h-3 w-3" />
              <span>{ticket.createdAt}</span>
            </div>
          )}
        </div>

        {/* Seat / Zone Highlight */}
        <div className="mt-4 rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Hạng vé / Vị trí chỗ
            </div>
            <span className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              Sẵn sàng chuyển nhượng
            </span>
          </div>

          <div className="mt-1 font-bold text-sm text-[#F97316]">
            {ticket.seatZone}
          </div>
        </div>

        {/* Seller Note / Reason */}
        {ticket.sellerNote && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-black/20 p-2.5 text-xs text-zinc-300 italic border border-zinc-800/40">
            <MessageSquare className="h-3.5 w-3.5 shrink-0 text-zinc-500 mt-0.5" />
            <span className="leading-relaxed">&ldquo;{ticket.sellerNote}&rdquo;</span>
          </div>
        )}
      </div>

      {/* Bottom row: Price & Action button */}
      <div className="mt-5 border-t border-zinc-800/80 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 line-through">
                Gốc: {ticket.originalPrice}
              </span>
              {discountPercent > 0 && (
                <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  -{discountPercent}%
                </span>
              )}
            </div>

            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-xl font-black text-white">
                {ticket.passPrice}
              </span>
            </div>
          </div>

          {/* Action CTA */}
          <Button
            type="button"
            onClick={() => onSelectBuy(ticket)}
            className="flex items-center gap-1.5 rounded-xl bg-[#F97316] hover:bg-[#ea6d0e] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <span>Chọn mua vé này</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
