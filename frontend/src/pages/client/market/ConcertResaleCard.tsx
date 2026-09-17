import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { ConcertResaleSummary } from "./marketplace.data";

interface ConcertResaleCardProps {
  concert: ConcertResaleSummary;
}

export default function ConcertResaleCard({ concert }: ConcertResaleCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#12131A] transition-all duration-300 hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/50">
      {/* Banner image with overlay */}
      <Link
        to={`/events/${concert.eventId}/resale`}
        className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900 block"
      >
        <img
          src={concert.image}
          alt={concert.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12131A] via-transparent to-transparent" />

        {/* Category tag */}
        <div className="absolute top-3 left-3">
          <span className="rounded-md border border-zinc-700/60 bg-black/60 px-2 py-0.5 text-[10px] font-bold text-zinc-200 backdrop-blur-sm uppercase">
            {concert.category}
          </span>
        </div>

        {/* People passing count badge */}
        <div className="absolute top-3 right-3">
          <span className="flex items-center gap-1.5 rounded-lg border border-orange-500/40 bg-[#F97316]/90 px-2.5 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
            <Users className="h-3.5 w-3.5" />
            {concert.passCount} người pass
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="text-xs font-semibold text-[#F97316]">
          {concert.artist}
        </div>

        <Link
          to={`/events/${concert.eventId}/resale`}
          className="mt-1 line-clamp-2 text-base font-bold text-white leading-snug group-hover:text-[#F97316] transition-colors"
        >
          {concert.title}
        </Link>

        {/* Date & Location */}
        <div className="mt-3 space-y-1.5 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
            <span className="truncate">{concert.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
            <span className="truncate">{concert.location}</span>
          </div>
        </div>

        {/* Available zones tags */}
        {concert.zonesAvailable.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {concert.zonesAvailable.slice(0, 3).map((zone) => (
              <span
                key={zone}
                className="rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-medium text-zinc-300"
              >
                {zone}
              </span>
            ))}
            {concert.zonesAvailable.length > 3 && (
              <span className="rounded-md border border-zinc-800 bg-zinc-900/40 px-1.5 py-0.5 text-[10px] text-zinc-500">
                +{concert.zonesAvailable.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price & CTA */}
        <div className="mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-4">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-500">Giá pass từ</span>
              {concert.maxDiscountPercent > 0 && (
                <span className="rounded bg-emerald-500/20 px-1 text-[10px] font-bold text-emerald-400">
                  -{concert.maxDiscountPercent}%
                </span>
              )}
            </div>
            <div className="text-lg font-extrabold text-white">
              {concert.minPassPrice}
            </div>
          </div>

          <Link
            to={`/events/${concert.eventId}/resale`}
            className="flex items-center gap-1.5 rounded-xl bg-[#F97316] hover:bg-[#ea6d0e] px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <span>Xem người pass</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
