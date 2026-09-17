import { Calendar, MapPin, Clock, Info } from "lucide-react";
import type { DetailedEvent } from "@/data/events.data";

interface EventInfoSectionProps {
  event: DetailedEvent;
}

export default function EventInfoSection({ event }: EventInfoSectionProps) {
  return (
    <div className="space-y-6">
      {/* THỜI GIAN & ĐỊA ĐIỂM CARD */}
      <div className="rounded-2xl border border-zinc-800 bg-[#12131A] p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700/60 text-[#F97316]">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium">Thời gian diễn ra</div>
            <div className="text-sm font-semibold text-white mt-0.5">{event.date}</div>
            <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3 text-zinc-500" />
              {event.time}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700/60 text-emerald-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium">Địa điểm tổ chức</div>
            <div className="text-sm font-semibold text-white mt-0.5">{event.venue}</div>
            <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
              {event.address}, {event.city}
            </div>
          </div>
        </div>
      </div>

      {/* THÔNG TIN SỰ KIỆN & QUY ĐỊNH */}
      <div className="rounded-2xl border border-zinc-800 bg-[#12131A] p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Giới thiệu sự kiện</h2>
        <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
          {event.description}
        </p>

        <div className="border-t border-zinc-800 pt-4 mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Lưu ý khi tham gia &amp; Công nghệ vé
          </h3>
          <ul className="space-y-2">
            {event.rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-zinc-400">
                <Info className="h-3.5 w-3.5 text-zinc-500 shrink-0 mt-0.5" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
