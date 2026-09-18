import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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

type FeaturedCarouselProps = {
  heading?: string;
  status?: string;
  featured?: boolean;
  tag?: string;
  hideWhenEmpty?: boolean;
};

function FeaturedCarousel({
  heading = "Sắp diễn ra",
  status,
  featured = false,
  tag,
  hideWhenEmpty = false,
}: FeaturedCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [isHovered, setIsHovered] = useState(false);
  const [items, setItems] = useState<FeaturedEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    eventApi
      .listEvents(
        featured
          ? { featured: true }
          : { status: status || "upcoming" },
      )
      .then((res) => {
        if (!isMounted) return;
        const dbItems: FeaturedEvent[] = (res.data?.events ?? []).map((e) => {
          const opened =
            typeof e.saleOpened === "boolean"
              ? e.saleOpened
              : !e.saleOpensAt || new Date(e.saleOpensAt) <= new Date();
          const soldOut = Boolean(e.soldOut);
          const ticketsAvailable =
            typeof e.ticketsAvailable === "boolean"
              ? e.ticketsAvailable
              : Boolean(e.salesOpen) && !soldOut;

          return {
            id: e.id,
            title: e.title,
            artist: e.artist || e.organizer || "Ban tổ chức",
            category: e.category || "Concert",
            image:
              e.bannerImage ||
              e.bannerUrl ||
              e.thumbnail ||
              "https://placehold.co/800x450",
            date: e.date || "Chưa cập nhật",
            location:
              e.location ||
              e.venue ||
              [e.place?.name, e.place?.city].filter(Boolean).join(", ") ||
              "—",
            priceRange: e.priceRange || "Liên hệ",
            officialLink: `/events/${e.id}`,
            ticketsAvailable,
            saleOpened: opened,
            soldOut,
            saleOpensAt: e.saleOpensAt ?? null,
            passCount: e.passCount || 0,
            tag:
              tag ||
              (featured
                ? "Nổi bật"
                : ticketsAvailable
                  ? "Còn vé"
                  : !opened
                    ? "Sắp mở bán"
                    : "Sắp diễn ra"),
            status: e.status,
          };
        });
        setItems(dbItems);
      })
      .catch((err) => {
        console.warn("[FeaturedCarousel] Lỗi tải events:", err?.message);
        if (isMounted) setItems([]);
      })
      .finally(() => {
        if (isMounted) setLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [featured, status, tag]);

  // Tự động next sau mỗi 3.5s và lặp vô tận (loop: true)
  useEffect(() => {
    if (!api || isHovered) return;

    const timer = setInterval(() => {
      api.scrollNext();
    }, 3500);

    return () => clearInterval(timer);
  }, [api, isHovered]);

  if (hideWhenEmpty && loaded && items.length === 0) return null;

  return (
    <section className="border-b border-zinc-800/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-[#F97316]" />
            <h2 className="text-base font-semibold text-white">{heading}</h2>
          </div>
        </div>

        {!loaded ? (
          <LoadingSpinner label="Đang tải sự kiện…" />
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            {featured
              ? "Chưa có sự kiện nổi bật."
              : "Chưa có sự kiện sắp diễn ra."}
          </p>
        ) : (
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
        )}
      </div>
    </section>
  );
}

export default FeaturedCarousel;
