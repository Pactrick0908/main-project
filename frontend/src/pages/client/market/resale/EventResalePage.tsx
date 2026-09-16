import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getResaleTicketsByEventId,
  MARKETPLACE_TICKETS,
  type MarketplaceTicket,
} from "../marketplace.data";
import { EVENTS_DATA } from "@/data/events.data";
import { eventApi } from "@/api/event.api";
import EventResaleHero from "./EventResaleHero";
import EventResaleFilter from "./EventResaleFilter";
import SellerOfferCard from "./SellerOfferCard";
import BuyP2PModal from "../BuyP2PModal";
import PostTicketModal from "../PostTicketModal";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EventResalePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventId = id ? parseInt(id, 10) : 1;

  // Thông tin concert (tải từ DB, fallback mock)
  const [officialEvent, setOfficialEvent] = useState<any>(() => EVENTS_DATA[eventId] || EVENTS_DATA[1]);

  useEffect(() => {
    let isMounted = true;
    eventApi.getEventById(eventId)
      .then((res) => {
        if (isMounted && res.data?.event) {
          setOfficialEvent(res.data.event);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // Tự động cuộn lên đầu trang khi mở hoặc đổi concert
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [eventId]);

  // Lấy danh sách người pass cho event này
  const eventTickets = useMemo(() => {
    return getResaleTicketsByEventId(eventId);
  }, [eventId]);
  const firstTicket = eventTickets[0];

  const eventTitle =
    officialEvent?.title || firstTicket?.title || "Sự kiện âm nhạc";
  const eventArtist = officialEvent?.artist || firstTicket?.artist || "";
  const eventBanner = officialEvent?.bannerImage || firstTicket?.image || "";
  const eventDate = officialEvent?.date || firstTicket?.date || "";
  const eventLocation = officialEvent?.venue || firstTicket?.location || "";
  const eventCategory =
    officialEvent?.category || firstTicket?.category || "Concert";

  // Thống kê
  const passCount = eventTickets.length;
  let minPassPrice = firstTicket?.passPrice || "0đ";
  let maxDiscount = 0;

  eventTickets.forEach((t) => {
    const pNum = parseInt(t.passPrice.replace(/\D/g, ""), 10) || 0;
    const oNum = parseInt(t.originalPrice.replace(/\D/g, ""), 10) || pNum;
    if (
      pNum > 0 &&
      (minPassPrice === "0đ" ||
        pNum < parseInt(minPassPrice.replace(/\D/g, ""), 10))
    ) {
      minPassPrice = t.passPrice;
    }
    if (oNum > pNum && oNum > 0) {
      const disc = Math.round(((oNum - pNum) / oNum) * 100);
      if (disc > maxDiscount) maxDiscount = disc;
    }
  });

  // Danh sách các zone duy nhất trong vé pass
  const availableZones = useMemo(() => {
    const set = new Set<string>();
    eventTickets.forEach((t) => {
      const zoneName = t.seatZone.split("—")[0].trim();
      set.add(zoneName);
    });
    return Array.from(set);
  }, [eventTickets]);

  // Filter & Sort state
  const [selectedZone, setSelectedZone] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modals state
  const [selectedTicket, setSelectedTicket] =
    useState<MarketplaceTicket | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // Filtered ticket list
  const filteredOffers = useMemo(() => {
    return eventTickets
      .filter((ticket) => {
        const matchZone =
          selectedZone === "all" || ticket.seatZone.includes(selectedZone);
        const matchSearch =
          ticket.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.seatZone.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.sellerNote.toLowerCase().includes(searchQuery.toLowerCase());

        return matchZone && matchSearch;
      })
      .sort((a, b) => {
        const pa = parseInt(a.passPrice.replace(/\D/g, ""), 10) || 0;
        const pb = parseInt(b.passPrice.replace(/\D/g, ""), 10) || 0;
        return sortOrder === "asc" ? pa - pb : pb - pa;
      });
  }, [eventTickets, selectedZone, searchQuery, sortOrder]);

  const handleOpenBuy = (ticket: MarketplaceTicket) => {
    setSelectedTicket(ticket);
    setIsBuyModalOpen(true);
    setBuySuccess(false);
  };

  const handleConfirmBuy = () => {
    setBuySuccess(true);
    setTimeout(() => {
      setIsBuyModalOpen(false);
      setBuySuccess(false);
      setSelectedTicket(null);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#090A0F] pb-16 pt-8 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 1. Hero Banner */}
        <EventResaleHero
          eventId={eventId}
          title={eventTitle}
          artist={eventArtist}
          image={eventBanner}
          date={eventDate}
          location={eventLocation}
          category={eventCategory}
          passCount={passCount}
          minPassPrice={minPassPrice}
          maxDiscountPercent={maxDiscount}
          onOpenPostTicket={() => setIsPostModalOpen(true)}
        />

        {/* 2. Filter & Sort Bar */}
        <EventResaleFilter
          zones={availableZones}
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortOrder={sortOrder}
          onToggleSort={() =>
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
          }
          totalOffers={filteredOffers.length}
        />

        {/* 3. Offer Cards Grid */}
        {filteredOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-[#12131A]/60 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-base font-bold text-white">
              Không tìm thấy vé pass phù hợp
            </p>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm">
              Thử chọn khu vực khác hoặc tìm kiếm với từ khóa khác, hoặc bạn có
              thể là người đầu tiên đăng bán vé cho khu vực này!
            </p>
            <Button
              onClick={() => {
                setSelectedZone("all");
                setSearchQuery("");
              }}
              variant="outline"
              className="mt-4 text-xs border-zinc-700 text-zinc-300 hover:text-white"
            >
              Xem tất cả người pass ({eventTickets.length})
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredOffers.map((ticket) => (
              <SellerOfferCard
                key={ticket.id}
                ticket={ticket}
                onSelectBuy={handleOpenBuy}
              />
            ))}
          </div>
        )}

        {/* 4. Modals */}
        <BuyP2PModal
          ticket={selectedTicket}
          isOpen={isBuyModalOpen}
          onClose={() => setIsBuyModalOpen(false)}
          onConfirmBuy={handleConfirmBuy}
          isSuccess={buySuccess}
        />

        <PostTicketModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onSuccess={() => {}}
        />
      </div>
    </div>
  );
}
