import { ArrowLeft, Calendar, MapPin, ShieldCheck, Ticket as TicketIcon, Sparkles, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface EventResaleHeroProps {
  eventId: number;
  title: string;
  artist: string;
  image: string;
  date: string;
  location: string;
  category: string;
  passCount: number;
  minPassPrice: string;
  maxDiscountPercent: number;
  onOpenPostTicket: () => void;
}

export default function EventResaleHero({
  eventId,
  title,
  artist,
  image,
  date,
  location,
  category,
  passCount,
  minPassPrice,
  maxDiscountPercent,
  onOpenPostTicket,
}: EventResaleHeroProps) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-zinc-800 bg-[#12131A]">
      {/* Background Banner with Gradient */}
      <div className="absolute inset-0 h-full w-full">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover object-center opacity-25 filter blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C0D14] via-[#12131A]/95 to-[#12131A]/90" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#0C0D14]/60 to-[#0C0D14]" />
      </div>

      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        {/* Breadcrumb Back */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur hover:border-zinc-700 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#F97316]" />
            Quay lại Chợ vé P2P
          </Link>

          <span className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-[#F97316] uppercase tracking-wide">
            {category} · P2P Marketplace
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left info */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F97316] uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Chợ Chuyển Nhượng Vé Concert
            </div>

            <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl lg:text-4xl leading-tight">
              {title}
            </h1>

            <p className="mt-2 text-sm font-medium text-zinc-300 sm:text-base">
              Nghệ sĩ: <span className="text-white font-semibold">{artist}</span>
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-500" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-500" />
                <span>{location}</span>
              </div>
            </div>

            {/* Resale stats chips */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs backdrop-blur">
                <span className="text-zinc-400">Đang có:</span>{" "}
                <span className="font-extrabold text-[#F97316] text-sm">
                  {passCount} người pass
                </span>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs backdrop-blur">
                <span className="text-zinc-400">Giá chỉ từ:</span>{" "}
                <span className="font-extrabold text-emerald-400 text-sm">
                  {minPassPrice}
                </span>
                {maxDiscountPercent > 0 && (
                  <span className="ml-2 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                    Tiết kiệm {maxDiscountPercent}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                100% Ký Quỹ Bảo Chứng
              </div>
            </div>
          </div>

          {/* Right Action Box */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
            <Button
              onClick={onOpenPostTicket}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#ea6d0e] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all cursor-pointer h-auto"
            >
              <TicketIcon className="h-4 w-4" />
              Đăng bán vé concert này
            </Button>

            <Link
              to={`/events/${eventId}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 px-5 py-3 text-xs font-semibold text-zinc-200 transition-colors text-center"
            >
              Xem vé gốc & sơ đồ ghế BTC
              <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
