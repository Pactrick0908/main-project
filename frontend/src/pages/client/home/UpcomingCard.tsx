import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";

export interface UpcomingEvent {
  id: number;
  title: string;
  artist: string;
  category: string;
  image: string;
  date: string;
  location: string;
  priceRange: string;
  officialLink: string;
  ticketsAvailable: boolean;
  passCount: number;
}

function UpcomingCard({ event }: { event: UpcomingEvent }) {
  return (
    <div className="group flex gap-4 rounded-xl border border-zinc-800 bg-[#12131A] p-4 transition-colors hover:border-zinc-700">
      {/* THUMBNAIL */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
        <img
          src={event.image}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>

      {/* INFO */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-white">
              {event.title}
            </h3>
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500">{event.artist}</p>
        </div>

        <div className="mt-2 space-y-0.5 text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0 text-zinc-600" />
            {event.date}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0 text-zinc-600" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-white">
            từ {event.priceRange.split("–")[0].trim()}
          </span>
          <div className="flex items-center gap-1.5">
            {event.passCount > 0 && (
              <Link
                to="/marketplace"
                className="text-[10px] text-zinc-400 hover:text-white transition-colors"
              >
                {event.passCount} vé pass
              </Link>
            )}
            <a
              href={event.officialLink}
              className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-colors ${
                event.ticketsAvailable
                  ? "bg-[#F97316] hover:bg-[#ea6d0e] text-white"
                  : "border border-zinc-700 text-zinc-500 cursor-not-allowed"
              }`}
            >
              {event.ticketsAvailable ? "Mua vé" : "Hết vé"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpcomingCard;
