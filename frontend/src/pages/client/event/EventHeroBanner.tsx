import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Zap } from "lucide-react";
import type { DetailedEvent } from "@/data/events.data";

interface EventHeroBannerProps {
  event: DetailedEvent;
}

export default function EventHeroBanner({ event }: EventHeroBannerProps) {
  return (
    <div className="relative h-[380px] sm:h-[460px] w-full overflow-hidden">
      <img
        src={event.bannerImage}
        alt={event.title}
        className="h-full w-full object-cover object-center filter brightness-90"
      />
      {/* Gradient dark overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F] via-[#090A0F]/60 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#090A0F]/90 via-[#090A0F]/40 to-transparent" />

      {/* Back Link */}
      <div className="absolute top-6 left-4 sm:left-8 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-black/50 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-zinc-300 border border-white/10 hover:bg-black/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>
      </div>

      {/* Content over Banner */}
      <div className="absolute bottom-6 left-4 right-4 sm:left-8 sm:right-8 max-w-7xl mx-auto z-10">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="rounded-md bg-[#F97316] px-2.5 py-1 text-xs font-bold text-white tracking-wide uppercase">
            {event.category}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            Vé Chính Hãng
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Dynamic QR 60s
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
          {event.title}
        </h1>
        <p className="mt-2 text-sm sm:text-base font-medium text-zinc-300">
          Nghệ sĩ:{" "}
          <span className="text-[#F97316] font-semibold">{event.artist}</span>
        </p>
      </div>
    </div>
  );
}
