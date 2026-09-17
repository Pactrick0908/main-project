import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mic2, ChevronRight, Star } from "lucide-react";
import { eventApi } from "@/api/event.api";

type StarArtist = {
  id: number;
  name: string;
  stageName: string | null;
  avatarUrl: string | null;
  eventCount: number;
};

export default function StarsSection() {
  const navigate = useNavigate();
  const [stars, setStars] = useState<StarArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    eventApi
      .search("")
      .then((res) => {
        if (!mounted) return;
        setStars(res.data.artists || []);
      })
      .catch(() => {
        if (mounted) setStars([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!loading && stars.length === 0) return null;

  return (
    <section className="border-b border-zinc-800/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#F97316]/15 text-[#F97316]">
              <Star className="size-4 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ngôi sao</h2>
              <p className="text-xs text-zinc-500">
                Nghệ sĩ nổi bật đang có sự kiện trên TicketFest
              </p>
            </div>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Xem thêm
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 w-28 shrink-0 animate-pulse rounded-2xl bg-zinc-900"
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible md:grid-cols-6">
            {stars.map((a) => {
              const display = a.stageName?.trim() || a.name;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    navigate(`/search?q=${encodeURIComponent(display)}`)
                  }
                  className="group flex w-[112px] shrink-0 flex-col items-center gap-2.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-4 text-center transition-colors hover:border-[#F97316]/40 hover:bg-zinc-900/70 sm:w-auto"
                >
                  <div className="relative">
                    {a.avatarUrl ? (
                      <img
                        src={a.avatarUrl}
                        alt={display}
                        className="size-16 rounded-full object-cover border border-zinc-700 ring-2 ring-transparent transition group-hover:ring-[#F97316]/30 sm:size-[72px]"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-full border border-zinc-700 bg-zinc-500/70 sm:size-[72px]">
                        <Mic2 className="size-6 text-zinc-300/80" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="truncate text-xs font-semibold text-white sm:text-sm">
                      {display}
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      {a.eventCount > 0
                        ? `${a.eventCount} sự kiện`
                        : "Nghệ sĩ"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
