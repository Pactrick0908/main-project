import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { FeaturedEvent } from "../../../pages/client/home/FeaturedCard";
import FeaturedCard from "../../../pages/client/home/FeaturedCard";
import { eventApi } from "@/api/event.api";

const FEATURED: FeaturedEvent[] = [
  {
    id: 99,
    title: "🧪 Vé Thử Nghiệm Thanh Toán PayOS (VietQR 2.000đ)",
    artist: "Hệ Thống Kiểm Thử Tự Động TicketFest",
    category: "Demo PayOS",
    image:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1400&q=80",
    date: "Hôm nay · Mở 24/7",
    location: "Cổng Thanh Toán Trực Tuyến PayOS",
    priceRange: "2.000đ",
    officialLink: "#",
    ticketsAvailable: true,
    passCount: 1,
    tag: "🧪 Test PayOS (2K)",
  },
  {
    id: 1,
    title: "Anh Trai Say Hi 2026 — The Final Concert Night 3",
    artist: "Dàn Cast Anh Trai Say Hi",
    category: "V-Pop",
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=80",
    date: "20:00 · Thứ Bảy, 28/09/2026",
    location: "Sân vận động Mỹ Đình, Hà Nội",
    priceRange: "1.500.000 – 3.500.000đ",
    officialLink: "#",
    ticketsAvailable: false,
    passCount: 12,
    tag: "Đang hot",
  },
  {
    id: 2,
    title: "BLACKPINK World Tour [BORN PINK] En-core Live in Saigon",
    artist: "BLACKPINK",
    category: "K-Pop",
    image:
      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1400&q=80",
    date: "19:30 · 15/10/2026",
    location: "Sân vận động Quân Khu 7, TP. HCM",
    priceRange: "3.500.000 – 8.500.000đ",
    officialLink: "#",
    ticketsAvailable: false,
    passCount: 3,
    tag: "Hết vé",
  },
  {
    id: 3,
    title: "See Sing Share 2026: Chân Trời Rực Rỡ",
    artist: "Hà Anh Tuấn",
    category: "V-Pop",
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=80",
    date: "19:00 · 05/11/2026",
    location: "Trung tâm Hội nghị Quốc tế, Đà Lạt",
    priceRange: "2.000.000 – 5.000.000đ",
    officialLink: "#",
    ticketsAvailable: true,
    passCount: 0,
    tag: "Còn vé",
  },
  {
    id: 4,
    title: "Ultra Music Festival Vietnam — Electric Dance Horizon",
    artist: "Martin Garrix, Hardwell, KSHMR",
    category: "EDM",
    image:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1400&q=80",
    date: "15:00 · 24/12/2026",
    location: "Khu đô thị Sala, TP. Thủ Đức",
    priceRange: "1.500.000 – 4.000.000đ",
    officialLink: "#",
    ticketsAvailable: true,
    passCount: 2,
    tag: "Sắp diễn ra",
  },
  {
    id: 5,
    title: "Rap Việt All-Star Live Concert 2026",
    artist: "Suboi, Karik, JustaTee, B Ray",
    category: "Rap",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=80",
    date: "19:00 · 12/12/2026",
    location: "SECC, Quận 7, TP. HCM",
    priceRange: "900.000 – 2.200.000đ",
    officialLink: "#",
    ticketsAvailable: true,
    passCount: 8,
  },
];

function FeaturedCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [isHovered, setIsHovered] = useState(false);
  const [items, setItems] = useState<FeaturedEvent[]>(FEATURED);

  // Tải danh sách sự kiện từ backend DB
  useEffect(() => {
    let isMounted = true;
    eventApi.listEvents()
      .then((res) => {
        if (isMounted && res.data?.events?.length > 0) {
          const dbItems: FeaturedEvent[] = res.data.events.map((e) => ({
            id: e.id,
            title: e.title,
            artist: e.artist,
            category: e.category || "Concert",
            image: e.bannerImage || e.thumbnail,
            date: e.date,
            location: e.venue,
            priceRange: e.priceRange || "Liên hệ",
            officialLink: `/events/${e.id}`,
            ticketsAvailable: e.ticketsAvailable,
            passCount: e.passCount || 0,
            tag: e.id === 99 ? "🧪 Test PayOS (2K)" : (e.ticketsAvailable ? "Còn vé" : "Hết vé"),
          }));

          // Giữ sự kiện demo test 99 ở đầu nếu DB chưa có
          const has99InDb = dbItems.some((item) => item.id === 99);
          const combined = has99InDb ? dbItems : [FEATURED[0], ...dbItems];
          setItems(combined);
        }
      })
      .catch((err) => {
        console.warn("[FeaturedCarousel] Dùng mock events:", err?.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Tự động next sau mỗi 3.5s và lặp vô tận (loop: true)
  useEffect(() => {
    if (!api || isHovered) return;

    const timer = setInterval(() => {
      api.scrollNext();
    }, 3500);

    return () => clearInterval(timer);
  }, [api, isHovered]);

  return (
    <section className="border-b border-zinc-800/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {/* SECTION LABEL */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-[#F97316]" />
            <h2 className="text-base font-semibold text-white">
              Sự kiện nổi bật
            </h2>
          </div>
        </div>

        {/* CAROUSEL */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Carousel
            opts={{ align: "start", loop: true }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {items.map((event) => (
                <CarouselItem
                  key={event.id}
                  className="pl-4 md:basis-1/2 lg:basis-2/5"
                >
                  <FeaturedCard event={event} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-4 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 cursor-pointer" />
            <CarouselNext className="hidden sm:flex -right-4 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 cursor-pointer" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}

export default FeaturedCarousel;
