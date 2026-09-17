import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Mic2,
  CalendarDays,
  MapPin,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { eventApi, type EventDto } from "@/api/event.api";
import UpcomingCard, {
  type UpcomingEvent,
} from "@/pages/client/home/UpcomingCard";

type SearchArtist = {
  id: number;
  name: string;
  stageName: string | null;
  avatarUrl: string | null;
  eventCount: number;
};

const FALLBACK_KEYWORDS = [
  "Anh Trai Say Hi",
  "BLACKPINK",
  "Hà Anh Tuấn",
  "EDM",
  "V-Pop",
  "Mỹ Đình",
];

function toUpcomingCard(e: EventDto): UpcomingEvent {
  return {
    id: e.id,
    title: e.title,
    description: e.description || "",
    banner_url: (e as any).bannerUrl || e.bannerImage || e.thumbnail || "",
    organizer_id: 0,
    place_id: 0,
    status: e.status || "upcoming",
    schedules: (e.schedules || []).map((s: any) => ({
      id: s.id,
      eventId: e.id,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
    zones: (e.zones || []).map((z: any) => ({
      id: Number(z.eventZoneId ?? z.id) || 0,
      eventId: e.id,
      zoneId: Number(z.zoneId) || 0,
      price: Number(z.price) || 0,
      totalSeats: Number(z.totalSeats) || 0,
    })),
    soldTickets: (e as any).soldTickets || 0,
    place: e.place || { name: e.venue, city: e.city },
    passCount: e.passCount || 0,
  };
}

function formatPrice(zones: EventDto["zones"]) {
  if (!zones?.length) return "—";
  const prices = zones.map((z) => Number(z.price) || 0).filter((p) => p > 0);
  if (!prices.length) return "—";
  const min = Math.min(...prices);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(min);
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const qParam = params.get("q") ?? "";

  const [input, setInput] = useState(qParam);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [artists, setArtists] = useState<SearchArtist[]>([]);
  const [hotKeywords, setHotKeywords] = useState<string[]>(FALLBACK_KEYWORDS);
  const [upcoming, setUpcoming] = useState<EventDto[]>([]);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await eventApi.search(q);
      setEvents(res.data.events || []);
      setArtists(res.data.artists || []);
      setHotKeywords(
        res.data.hotKeywords?.length
          ? res.data.hotKeywords
          : FALLBACK_KEYWORDS,
      );
      setUpcoming(res.data.upcoming || []);
    } catch (err) {
      console.warn("[SearchPage]", err);
      setEvents([]);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setInput(qParam);
    void runSearch(qParam);
  }, [qParam, runSearch]);

  const submit = (raw?: string) => {
    const next = (raw ?? input).trim();
    if (next) {
      setParams({ q: next });
    } else {
      setParams({});
    }
  };

  const hasQuery = Boolean(qParam.trim());
  const totalHits = events.length + artists.length;

  const upcomingCards = useMemo(
    () => upcoming.slice(0, 3).map(toUpcomingCard),
    [upcoming],
  );

  return (
    <div className="min-h-screen bg-[#090A0F] text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search box */}
        <div className="mb-8">
          <h1 className="mb-1 text-xl font-bold text-white sm:text-2xl">
            Tìm concert / nghệ sĩ
          </h1>
          <p className="mb-4 text-sm text-zinc-500">
            Gõ tên sự kiện, nghệ sĩ hoặc địa điểm
          </p>
          <form
            className="relative"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="VD: Anh Trai Say Hi, BLACKPINK, Mỹ Đình…"
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900/70 pl-11 pr-24 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[#F97316]/50 focus:ring-2 focus:ring-[#F97316]/20"
              autoFocus
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {input && (
                <button
                  type="button"
                  onClick={() => {
                    setInput("");
                    setParams({});
                  }}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                className="rounded-lg bg-[#F97316] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#ea6d0e]"
              >
                Tìm
              </button>
            </div>
          </form>
        </div>

        {/* ── PHẦN TRÊN: kết quả / từ khóa nổi bật ───────────────── */}
        <section className="mb-10 rounded-2xl border border-zinc-800 bg-[#12131A] p-4 sm:p-5">
          {!hasQuery ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#F97316]" />
                <h2 className="text-sm font-bold text-white">
                  Từ khóa nổi bật
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {hotKeywords.map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => submit(kw)}
                    className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-[#F97316]/50 hover:text-white"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-white">
                  Kết quả cho “{qParam}”
                </h2>
                <span className="text-[11px] text-zinc-500">
                  {loading ? "Đang tìm…" : `${totalHits} kết quả`}
                </span>
              </div>

              {loading ? (
                <p className="py-8 text-center text-xs text-zinc-500">
                  Đang tìm kiếm…
                </p>
              ) : totalHits === 0 ? (
                <p className="py-8 text-center text-xs text-zinc-500">
                  Không tìm thấy concert hay nghệ sĩ phù hợp.
                </p>
              ) : (
                <div className="space-y-6">
                  {artists.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        <Mic2 className="h-3.5 w-3.5" />
                        Nghệ sĩ ({artists.length})
                      </p>
                      <div className="flex gap-3 overflow-x-auto pb-1">
                        {artists.map((a) => {
                          const name = a.stageName?.trim() || a.name;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => submit(name)}
                              className="flex w-[100px] shrink-0 flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-2 py-3 text-center hover:border-zinc-600"
                            >
                              {a.avatarUrl ? (
                                <img
                                  src={a.avatarUrl}
                                  alt={name}
                                  className="size-12 rounded-full object-cover border border-zinc-700"
                                />
                              ) : (
                                <div className="size-12 rounded-full bg-zinc-500/80 border border-zinc-700" />
                              )}
                              <span className="w-full truncate text-[11px] font-semibold text-white">
                                {name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {events.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Concert ({events.length})
                      </p>
                      <div className="space-y-2">
                        {events.map((e) => (
                          <Link
                            key={e.id}
                            to={`/events/${e.id}`}
                            className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-2.5 transition-colors hover:border-[#F97316]/40 hover:bg-zinc-900/70"
                          >
                            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                              {(e.bannerUrl || e.bannerImage) && (
                                <img
                                  src={e.bannerUrl || e.bannerImage}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white">
                                {e.title}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                                {e.artist ||
                                  e.artists
                                    ?.map((a) => a.stageName || a.name)
                                    .join(", ") ||
                                  "—"}
                              </p>
                              <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {e.venue || e.place?.name || "—"}
                                  {e.city ? `, ${e.city}` : ""}
                                </span>
                              </p>
                              <p className="mt-0.5 text-[11px] font-medium text-[#F97316]">
                                từ {formatPrice(e.zones)}
                              </p>
                            </div>
                            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-600" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* ── PHẦN DƯỚI: 2–3 sự kiện sắp diễn ra ─────────────────── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              Sự kiện sắp diễn ra
            </h2>
            <Link
              to="/#events"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
                setTimeout(() => {
                  document
                    .getElementById("events")
                    ?.scrollIntoView({ behavior: "smooth" });
                }, 80);
              }}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Xem tất cả
            </Link>
          </div>
          {upcomingCards.length === 0 ? (
            <p className="py-8 text-center text-xs text-zinc-500">
              Chưa có sự kiện sắp diễn ra.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingCards.map((event) => (
                <UpcomingCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
