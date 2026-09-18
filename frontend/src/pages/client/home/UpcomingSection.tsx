import { ChevronRight, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UpcomingCard from "./UpcomingCard";
import type { UpcomingEvent } from "./UpcomingCard";
import { eventApi } from "@/api/event.api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function UpcomingSection() {
  const [eventsList, setEventsList] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Tải danh sách sự kiện từ DB
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    eventApi
      .listEvents({ status: "open" })
      .then((res) => {
        if (isMounted) {
          const dbEvents: UpcomingEvent[] = (res.data?.events ?? []).map(
            (e: any) => ({
              id: e.id,
              title: e.title,
              description: e.description || "",
              banner_url: e.banner_url || e.bannerImage || e.thumbnail || "",
              organizer_id: e.organizer_id,
              place_id: e.place_id,
              status: e.status,
              schedules: e.schedules || [],
              zones: e.zones || [],
              soldTickets: e.soldTickets || 0,
              place: e.place,
              passCount: e.passCount || 0,
            }),
          );
          setEventsList(dbEvents);
        }
      })
      .catch((err) => {
        console.warn("[UpcomingSection] Lỗi tải events:", err?.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="events" className="border-b border-zinc-800/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-white">Đang mở bán</h2>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Chợ trao đổi vé
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner label="Đang tải sự kiện…" />
        ) : eventsList.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            Chưa có sự kiện đang mở bán.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventsList.map((event) => (
              <UpcomingCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default UpcomingSection;
