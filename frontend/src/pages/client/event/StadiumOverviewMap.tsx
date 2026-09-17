import { Calendar, MapPin, Sparkles, Maximize2, Armchair } from "lucide-react";
import type { DetailedEvent } from "@/data/events.data";

interface StadiumOverviewMapProps {
  event: DetailedEvent;
  totalTickets: number;
  allSelectedSeats: string[];
  isZoomed: boolean;
  onToggleZoom: () => void;
  onOpenSeatBoard: () => void;
}

export default function StadiumOverviewMap({
  event,
  totalTickets,
  allSelectedSeats,
  isZoomed,
  onToggleZoom,
  onOpenSeatBoard,
}: StadiumOverviewMapProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#12131A] p-4 sm:p-5">
      {/* Header thông tin sự kiện */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <span className="rounded bg-[#F97316]/20 text-[#F97316] text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
            {event.category}
          </span>
          <h1 className="mt-1.5 text-lg sm:text-xl font-extrabold text-white leading-snug line-clamp-2">
            {event.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#F97316]" />
              {event.date}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              {event.venue}
            </span>
          </div>
          {(event.organizer || event.logoUrl) && (
            <div className="mt-2.5 flex items-center gap-2">
              {event.logoUrl ? (
                <img
                  src={event.logoUrl}
                  alt={event.organizer || "Nhà tổ chức"}
                  className="h-7 w-7 rounded-md border border-zinc-700 object-cover bg-zinc-900"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-[10px] font-bold text-zinc-400">
                  BTC
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Nhà tổ chức
                </div>
                <div className="text-xs font-semibold text-zinc-200 truncate">
                  {event.organizer}
                </div>
              </div>
            </div>
          )}
        </div>

        {totalTickets > 0 && (
          <button
            type="button"
            onClick={onOpenSeatBoard}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#ea6d0e] transition-colors cursor-pointer"
          >
            <Armchair className="h-3.5 w-3.5" />
            Bảng chọn ghế ({allSelectedSeats.length}/{totalTickets})
          </button>
        )}
      </div>

      {/* Sơ đồ khán đài */}
      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-black/60 group">
        <img
          src={
            event.mapUrl ||
            "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80"
          }
          alt="Sơ đồ khán đài"
          className={`w-full h-[380px] sm:h-[460px] object-cover object-center transition-all duration-300 ${
            isZoomed
              ? "scale-125 cursor-zoom-out"
              : "cursor-zoom-in group-hover:scale-105"
          }`}
          onClick={onToggleZoom}
        />
        {/* Overlay chỉ dẫn */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="rounded-lg bg-black/75 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-white border border-white/10 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[#F97316]" />
            SƠ ĐỒ KHÁN ĐÀI CHÍNH THỨC
          </span>
          <span
            className="rounded-lg bg-black/75 backdrop-blur-md px-2.5 py-1.5 text-[10px] text-zinc-300 border border-white/10 flex items-center gap-1 pointer-events-auto cursor-pointer"
            onClick={onToggleZoom}
          >
            <Maximize2 className="h-3 w-3" />
            {isZoomed ? "Thu nhỏ" : "Phóng to"}
          </span>
        </div>

        {/* Chú thích Hướng sân khấu */}
        <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/80 backdrop-blur-md p-2.5 border border-white/10 text-center">
          <div className="text-[11px] font-black tracking-widest text-[#F97316] uppercase">
            ▲ HƯỚNG SÂN KHẤU CHÍNH (STAGE) ▲
          </div>
        </div>
      </div>

      {/* Hướng dẫn hoặc trạng thái chọn ghế */}
      {totalTickets === 0 ? (
        <div className="mt-3.5 rounded-xl border border-dashed border-orange-500/40 bg-orange-500/10 p-3 text-center text-xs text-orange-300 flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-[#F97316] shrink-0" />
          <span>
            👉 Hãy bấm nút <strong>(+)</strong> chọn số lượng vé ở cột bên phải để mở{" "}
            <strong>Bảng chọn chỗ ngồi theo khu vực (SVIP, VIP, CAT...)</strong>!
          </span>
        </div>
      ) : (
        <div className="mt-3.5 flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
          <div className="text-xs text-zinc-300 flex items-center gap-2">
            <Armchair className="h-4 w-4 text-[#F97316]" />
            <span>
              Đang chọn {totalTickets} vé:{" "}
              {allSelectedSeats.length > 0 ? allSelectedSeats.join(", ") : "Chưa chọn ghế"}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenSeatBoard}
            className="rounded-lg bg-[#F97316] hover:bg-[#ea6d0e] px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Chọn ghế theo khu vực
          </button>
        </div>
      )}
    </div>
  );
}
