import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";

export interface EventSchedule {
  id: number;
  eventId?: number;
  startTime: Date | string;
  endTime: Date | string;
}

export interface EventZone {
  id: number;
  eventId?: number;
  zoneId?: number;
  price: number;
  totalSeats: number;
  available?: number;
}

export interface UpcomingEvent {
  id: number;
  banner_url: string;
  description: string;
  organizer_id?: number;
  place_id?: number;
  status: string;
  title: string;
  schedules: Array<EventSchedule>;
  zones: Array<EventZone>;
  soldTickets: number;
  place?: { name?: string; address?: string; city?: string };
  passCount?: number;
  saleOpensAt?: string | null;
  ticketsAvailable?: boolean;
  saleOpened?: boolean;
  soldOut?: boolean;
}

function UpcomingCard({ event }: { event: UpcomingEvent }) {
  const minPrice =
    event.zones && event.zones.length > 0
      ? Math.min(...event.zones.map((z) => Number(z.price) || 0).filter((p) => p > 0))
      : null;

  const saleOpened =
    typeof event.saleOpened === "boolean"
      ? event.saleOpened
      : !event.saleOpensAt || new Date(event.saleOpensAt) <= new Date();

  const soldOut =
    typeof event.soldOut === "boolean"
      ? event.soldOut
      : (() => {
          const totalSeats = (event.zones || []).reduce(
            (sum, z) => sum + (z.totalSeats || 0),
            0,
          );
          return totalSeats > 0 && totalSeats <= (event.soldTickets || 0);
        })();

  const canBuy =
    typeof event.ticketsAvailable === "boolean"
      ? event.ticketsAvailable
      : saleOpened && !soldOut && event.status !== "ended" && event.status !== "draft";

  const firstSchedule = event.schedules?.[0];
  const formattedDate = firstSchedule
    ? new Date(firstSchedule.startTime).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Chưa cập nhật";

  const locationText =
    [event.place?.name, event.place?.city].filter(Boolean).join(", ") ||
    (event.place_id ? `Địa điểm #${event.place_id}` : "—");

  const saleLabel = event.saleOpensAt
    ? new Date(event.saleOpensAt).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="group flex gap-4 rounded-xl border border-zinc-800 bg-[#12131A] p-4 transition-colors hover:border-zinc-700">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
        <img
          src={event.banner_url || "https://placehold.co/600x400"}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-white">
              {event.title}
            </h3>
          </div>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">
            {event.description}
          </p>
        </div>

        <div className="mt-2 space-y-0.5 text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0 text-zinc-600" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0 text-zinc-600" />
            <span className="truncate">{locationText}</span>
          </div>
          {!saleOpened && saleLabel && (
            <p className="text-[10px] text-amber-400/90">Mở bán: {saleLabel}</p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-white">
            {minPrice != null && Number.isFinite(minPrice)
              ? `từ ${minPrice.toLocaleString("vi-VN")} đ`
              : "Liên hệ"}
          </span>

          <div className="flex items-center gap-1.5">
            {event.passCount && event.passCount > 0 ? (
              <Link
                to={`/events/${event.id}/resale`}
                className="text-[10px] text-zinc-400 hover:text-white transition-colors"
              >
                {event.passCount} vé pass
              </Link>
            ) : null}

            {canBuy ? (
              <Link
                to={`/events/${event.id}`}
                className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold bg-[#F97316] hover:bg-[#ea6d0e] text-white transition-colors"
              >
                Mua vé
              </Link>
            ) : soldOut ? (
              <span className="inline-flex h-7 items-center rounded-lg px-2.5 text-[11px] font-semibold border border-zinc-700 text-zinc-500 cursor-not-allowed">
                Hết vé
              </span>
            ) : !saleOpened ? (
              <span className="inline-flex h-7 items-center rounded-lg px-2.5 text-[11px] font-semibold border border-amber-500/30 text-amber-300/90">
                Sắp mở bán
              </span>
            ) : (
              <span className="inline-flex h-7 items-center rounded-lg px-2.5 text-[11px] font-semibold border border-zinc-700 text-zinc-500 cursor-not-allowed">
                Ngừng bán
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpcomingCard;
