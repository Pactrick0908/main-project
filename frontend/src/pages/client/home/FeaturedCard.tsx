import { Calendar, ExternalLink, MapPin, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export interface FeaturedEvent {
  id: number;
  title: string;
  artist: string;
  category: string;
  image: string;
  date: string;
  location: string;
  priceRange: string;
  officialLink: string;
  /** Đang mở bán và còn vé → hiện nút Mua vé */
  ticketsAvailable: boolean;
  /** Đã tới giờ mở bán (saleOpensAt) */
  saleOpened: boolean;
  soldOut: boolean;
  saleOpensAt?: string | null;
  passCount: number;
  tag?: string;
  status?: string;
}

function FeaturedCard({ event }: { event: FeaturedEvent }) {
  const saleLabel = event.saleOpensAt
    ? new Date(event.saleOpensAt).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const cta = (() => {
    if (event.ticketsAvailable) {
      return (
        <Link
          to={`/events/${event.id}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold bg-[#F97316] hover:bg-[#ea6d0e] text-white transition-colors"
        >
          Mua vé
          <ExternalLink className="h-3 w-3" />
        </Link>
      );
    }
    if (event.soldOut) {
      return (
        <span className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold border border-zinc-700 bg-zinc-900/50 text-zinc-500 cursor-not-allowed">
          Hết vé
        </span>
      );
    }
    if (!event.saleOpened) {
      return (
        <span
          className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold border border-zinc-700 bg-zinc-900/50 text-zinc-400"
          title={saleLabel ? `Mở bán: ${saleLabel}` : undefined}
        >
          Sắp mở bán
        </span>
      );
    }
    return (
      <span className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold border border-zinc-700 bg-zinc-900/50 text-zinc-500 cursor-not-allowed">
        Ngừng bán
      </span>
    );
  })();

  const tag =
    event.tag ||
    (event.ticketsAvailable
      ? "Còn vé"
      : event.soldOut
        ? "Hết vé"
        : !event.saleOpened
          ? "Sắp mở bán"
          : undefined);

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#12131A] h-full transition-colors hover:border-zinc-700">
      <div className="relative aspect-[16/9] overflow-hidden bg-zinc-900">
        <img
          src={event.image}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,#12131A_10%,transparent_65%)]" />

        {tag && (
          <div className="absolute top-3 left-3">
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                tag === "Đang hot" || tag === "Nổi bật"
                  ? "bg-[#F97316] text-white"
                  : tag === "Hết vé" || tag === "Ngừng bán"
                    ? "bg-zinc-700 text-zinc-200"
                    : tag === "Còn vé"
                      ? "bg-emerald-600 text-white"
                      : tag === "Sắp mở bán"
                        ? "border border-amber-500/40 bg-amber-500/15 text-amber-200"
                        : "border border-zinc-600 bg-zinc-900/80 text-zinc-300"
              }`}
            >
              {tag}
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3">
          <span className="rounded-md border border-zinc-700/60 bg-black/60 px-2 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur-sm">
            {event.category}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-medium text-zinc-500">{event.artist}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-white">
          {event.title}
        </h3>

        <div className="mt-3 space-y-1.5 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
            {event.date}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
            <span className="truncate">{event.location}</span>
          </div>
          {!event.saleOpened && saleLabel && (
            <p className="text-[10px] text-amber-400/90">Mở bán: {saleLabel}</p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3 gap-3">
          <div>
            <div className="text-[10px] text-zinc-500">Giá vé từ</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {event.priceRange.split("–")[0].trim()}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {event.passCount > 0 && (
              <Link
                to={`/events/${event.id}/resale`}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900/50 px-2.5 text-[11px] font-medium text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
              >
                <RefreshCw className="h-3 w-3 text-zinc-500" />
                {event.passCount} pass
              </Link>
            )}
            {cta}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeaturedCard;
