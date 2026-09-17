import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Mic2,
  CalendarDays,
  MapPin,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { eventApi, type EventDto } from "@/api/event.api";

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

type HeaderSearchProps = {
  className?: string;
  /** Mobile: full width trong sheet */
  variant?: "desktop" | "mobile";
};

export default function HeaderSearch({
  className = "",
  variant = "desktop",
}: HeaderSearchProps) {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [artists, setArtists] = useState<SearchArtist[]>([]);
  const [hotKeywords, setHotKeywords] = useState<string[]>(FALLBACK_KEYWORDS);
  const [upcoming, setUpcoming] = useState<EventDto[]>([]);

  const fetchData = useCallback(async (q: string) => {
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
      setUpcoming((res.data.upcoming || []).slice(0, 3));
    } catch {
      setEvents([]);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search khi panel mở
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      void fetchData(query.trim());
    }, query.trim() ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [open, query, fetchData]);

  // Click ngoài → đóng
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // ⌘K mở panel
  useEffect(() => {
    if (variant !== "desktop") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  const hasQuery = Boolean(query.trim());
  const totalHits = events.length + artists.length;

  const applyKeyword = (kw: string) => {
    setQuery(kw);
    setOpen(true);
    inputRef.current?.focus();
  };

  const goFullSearch = () => {
    const q = query.trim();
    setOpen(false);
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <form
        className="relative w-full"
        onSubmit={(e) => {
          e.preventDefault();
          goFullSearch();
        }}
      >
        <Search className="pointer-events-none absolute left-2.5 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Tìm sự kiện / nghệ sĩ..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          className="h-8 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 pl-8 pr-10 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none focus:bg-zinc-900 transition-colors"
        />
        {variant === "desktop" && (
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-zinc-800 bg-zinc-950 px-1 text-[9px] font-mono text-zinc-500">
            ⌘K
          </kbd>
        )}
      </form>

      {/* Bảng kết quả — ngay dưới ô search */}
      {open && (
        <div
          className={`absolute left-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-zinc-800 bg-[#0E0F16] shadow-2xl ${
            variant === "desktop"
              ? "w-[min(400px,calc(100vw-2rem))]"
              : "right-0 w-full"
          }`}
        >
          <div className="max-h-[min(70vh,480px)] overflow-y-auto">
            {/* Phần trên: từ khóa / kết quả */}
            <div className="border-b border-zinc-800 p-3">
              {!hasQuery ? (
                <>
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <Sparkles className="h-3 w-3 text-[#F97316]" />
                    Từ khóa nổi bật
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {hotKeywords.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => applyKeyword(kw)}
                        className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-[#F97316]/40 hover:text-white"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Kết quả “{query.trim()}”
                    </p>
                    {loading && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                    )}
                  </div>

                  {!loading && totalHits === 0 && (
                    <p className="py-3 text-center text-[11px] text-zinc-500">
                      Không tìm thấy kết quả
                    </p>
                  )}

                  {artists.length > 0 && (
                    <div className="mb-2">
                      <p className="mb-1.5 flex items-center gap-1 text-[10px] text-zinc-500">
                        <Mic2 className="h-3 w-3" /> Nghệ sĩ
                      </p>
                      <div className="space-y-0.5">
                        {artists.slice(0, 4).map((a) => {
                          const name = a.stageName?.trim() || a.name;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => applyKeyword(name)}
                              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-zinc-800/70"
                            >
                              {a.avatarUrl ? (
                                <img
                                  src={a.avatarUrl}
                                  alt=""
                                  className="size-7 rounded-full object-cover"
                                />
                              ) : (
                                <div className="size-7 rounded-full bg-zinc-500/80" />
                              )}
                              <span className="truncate text-xs font-medium text-zinc-200">
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
                      <p className="mb-1.5 flex items-center gap-1 text-[10px] text-zinc-500">
                        <CalendarDays className="h-3 w-3" /> Concert
                      </p>
                      <div className="space-y-0.5">
                        {events.slice(0, 5).map((e) => (
                          <Link
                            key={e.id}
                            to={`/events/${e.id}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-800/70"
                          >
                            <div className="h-9 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                              {(e.bannerUrl || e.bannerImage) && (
                                <img
                                  src={e.bannerUrl || e.bannerImage}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-white">
                                {e.title}
                              </p>
                              <p className="truncate text-[10px] text-zinc-500">
                                {e.artist || e.venue || "—"}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Phần dưới: sắp diễn ra */}
            <div className="p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Sự kiện sắp diễn ra
              </p>
              {upcoming.length === 0 ? (
                <p className="py-2 text-center text-[11px] text-zinc-600">
                  Chưa có sự kiện
                </p>
              ) : (
                <div className="space-y-0.5">
                  {upcoming.map((e) => (
                    <Link
                      key={e.id}
                      to={`/events/${e.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-800/70"
                    >
                      <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                        {(e.bannerUrl || e.bannerImage) && (
                          <img
                            src={e.bannerUrl || e.bannerImage}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-xs font-medium text-zinc-200">
                          {e.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-500">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">
                            {e.venue || e.place?.name || "—"}
                          </span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={goFullSearch}
            className="flex w-full items-center justify-center gap-1.5 border-t border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            Xem trang tìm kiếm đầy đủ
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
