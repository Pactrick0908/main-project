import { Calendar, MapPin, ShieldCheck, MessageSquare } from "lucide-react";
import type { MarketplaceTicket } from "./marketplace.data";

interface MarketplaceCardProps {
  ticket: MarketplaceTicket;
  onSelectBuy: (ticket: MarketplaceTicket) => void;
}

export default function MarketplaceCard({
  ticket,
  onSelectBuy,
}: MarketplaceCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#12131A] transition-colors hover:border-zinc-700">
      {/* Image & Tags */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
        <img
          src={ticket.image}
          alt={ticket.title}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12131A] via-transparent to-transparent" />

        <div className="absolute top-3 left-3">
          <span className="rounded-md border border-zinc-700/60 bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-zinc-200 backdrop-blur-sm uppercase">
            {ticket.category}
          </span>
        </div>

        {ticket.verified && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3" />
              Đã xác thực
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="text-[11px] font-medium text-zinc-500">{ticket.artist}</div>
        <h3 className="mt-1 line-clamp-2 text-sm font-bold text-white leading-snug">
          {ticket.title}
        </h3>

        <div className="mt-3 space-y-1.5 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
            {ticket.date}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
            <span className="truncate">{ticket.location}</span>
          </div>
        </div>

        {/* Seat zone */}
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 text-xs font-semibold text-[#F97316]">
          {ticket.seatZone}
        </div>

        {/* Seller Note */}
        {ticket.sellerNote && (
          <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-zinc-400 italic">
            <MessageSquare className="h-3 w-3 shrink-0 text-zinc-500 mt-0.5" />
            <span className="line-clamp-1">&quot;{ticket.sellerNote}&quot;</span>
          </div>
        )}

        {/* Price & Buy Button */}
        <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3">
          <div>
            <div className="text-[10px] text-zinc-500 line-through">
              Gốc: {ticket.originalPrice}
            </div>
            <div className="text-base font-extrabold text-[#F97316]">
              {ticket.passPrice}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectBuy(ticket)}
            className="rounded-xl bg-[#F97316] hover:bg-[#ea6d0e] px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Mua vé P2P
          </button>
        </div>
      </div>
    </div>
  );
}
