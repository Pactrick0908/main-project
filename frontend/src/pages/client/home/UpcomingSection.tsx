import { ChevronRight, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UpcomingCard from "./UpcomingCard";
import type { UpcomingEvent } from "./UpcomingCard";
import { eventApi } from "@/api/event.api";

const ALL_CATEGORIES = [
  "Tất cả",
  "V-Pop",
  "K-Pop",
  "Rap",
  "Indie",
  "EDM",
  "Concert",
];

function UpcomingSection() {
  const [active, setActive] = useState("Tất cả");
  const [eventsList, setEventsList] = useState<UpcomingEvent[]>([]);

  // Tải danh sách sự kiện từ DB
  useEffect(() => {
    let isMounted = true;
    eventApi
      .listEvents()
      .then((res) => {
        if (isMounted && res.data?.events?.length > 0) {
          const dbEvents: UpcomingEvent[] = res.data.events.map((e) => ({
            id: e.id,
            title: e.title,
            artist: e.artist,
            category: e.category || "V-Pop",
            image: e.bannerImage || e.thumbnail,
            date: e.date,
            location: e.venue,
            priceRange: e.priceRange || "Liên hệ",
            officialLink: `/events/${e.id}`,
            ticketsAvailable: e.ticketsAvailable,
            passCount: e.passCount || 0,
          }));
          setEventsList(dbEvents);
        }
      })
      .catch((err) => {
        console.warn("[UpcomingSection] Dùng mock events:", err?.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered =
    active === "Tất cả"
      ? eventsList
      : eventsList.filter((e) => e.category === active);

  return (
    <section id="events" className="border-b border-zinc-800/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-white">Sự kiện sắp tới</h2>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Chợ trao đổi vé
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* CATEGORY TABS */}
        <div className="mb-5 flex items-center gap-1.5 overflow-x-auto pb-1">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                active === cat
                  ? "bg-zinc-100 text-black"
                  : "border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <UpcomingCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default UpcomingSection;
