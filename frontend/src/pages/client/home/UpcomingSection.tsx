import { ChevronRight, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import UpcomingCard from "./UpcomingCard";
import type { UpcomingEvent } from "./UpcomingCard";

const ALL_CATEGORIES = ["Tất cả", "V-Pop", "K-Pop", "Rap", "Indie", "EDM"];

const UPCOMING: UpcomingEvent[] = [
  {
    id: 6,
    title: "Những Thành Phố Mơ Màng Year-End Music Festival",
    artist: "Vũ, Chillies, Ngọt, Đen Vâu",
    category: "Indie",
    image:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
    date: "16:00 · 20/11/2026",
    location: "Công viên Yên Sở, Hà Nội",
    priceRange: "500.000 – 900.000đ",
    officialLink: "#",
    ticketsAvailable: true,
    passCount: 5,
  },
  {
    id: 7,
    title: "Chị Đẹp Đạp Gió Rẽ Sóng 2026 — The Grand Gala Night",
    artist: "Dàn Nghệ Sĩ Chị Đẹp",
    category: "V-Pop",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    date: "20:00 · 08/01/2027",
    location: "SECC, TP. HCM",
    priceRange: "1.500.000 – 3.500.000đ",
    officialLink: "#",
    ticketsAvailable: true,
    passCount: 0,
  },
  {
    id: 8,
    title: "Monsoon Music Festival: Gió Mùa Âm Nhạc Di Sản",
    artist: "Quốc tế & Indie Việt",
    category: "Indie",
    image:
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80",
    date: "17:00 · 18/01/2027",
    location: "Hoàng Thành Thăng Long, Hà Nội",
    priceRange: "800.000 – 1.800.000đ",
    officialLink: "#",
    ticketsAvailable: true,
    passCount: 3,
  },
];

function UpcomingSection() {
  const [active, setActive] = useState("Tất cả");

  const filtered =
    active === "Tất cả"
      ? UPCOMING
      : UPCOMING.filter((e) => e.category === active);

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
