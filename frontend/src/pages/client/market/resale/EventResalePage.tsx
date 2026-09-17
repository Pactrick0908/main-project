import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  listingToMarketplaceTicket,
  type MarketplaceTicket,
} from "../marketplace.data";
import { EVENTS_DATA } from "@/data/events.data";
import { eventApi } from "@/api/event.api";
import { marketplaceApi } from "@/api/marketplace.api";
import EventResaleHero from "./EventResaleHero";
import EventResaleFilter from "./EventResaleFilter";
import SellerOfferCard from "./SellerOfferCard";
import BuyP2PModal from "../BuyP2PModal";
import PostTicketModal from "../PostTicketModal";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

export default function EventResalePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventId = id ? parseInt(id, 10) : 1;

  const [officialEvent, setOfficialEvent] = useState<any>(
    () => EVENTS_DATA[eventId] || EVENTS_DATA[1],
  );
  const [eventTickets, setEventTickets] = useState<MarketplaceTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marketplaceApi.listListings({ eventId });
      setEventTickets(
        (res.data?.listings || []).map((l) => listingToMarketplaceTicket(l)),
      );
    } catch (err: any) {
      toast.error(err?.message || "Không tải được vé pass");
      setEventTickets([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    let isMounted = true;
    eventApi
      .getEventById(eventId)
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    void loadOffers();
  }, [eventId, loadOffers]);

  const firstTicket = eventTickets[0];
  const eventTitle =
    officialEvent?.title || firstTicket?.title || "Sự kiện âm nhạc";
  const eventArtist =
    officialEvent?.artist ||
    officialEvent?.artists?.[0]?.name ||
    firstTicket?.artist ||
    "";
  const eventBanner =
    officialEvent?.bannerImage ||
    officialEvent?.bannerUrl ||
    firstTicket?.image ||
    "";
  const eventDate = officialEvent?.date || firstTicket?.date || "";
  const eventLocation =
    officialEvent?.venue ||
    officialEvent?.place?.name ||
    firstTicket?.location ||
    "";
  const eventCategory =
    officialEvent?.category || firstTicket?.category || "Concert";

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

  const availableZones = useMemo(() => {
    const set = new Set<string>();
    eventTickets.forEach((t) => {
      const zoneName = t.seatZone.split("—")[0].trim().split("·")[0].trim();
      set.add(zoneName);
    });
    return Array.from(set);
  }, [eventTickets]);

  const [selectedZone, setSelectedZone] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedTicket, setSelectedTicket] =
    useState<MarketplaceTicket | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    qrCode: string;
    checkoutUrl: string;
    amount: number;
    tradeId: number;
    payosOrderCode: number;
  } | null>(null);

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
    setPaymentInfo(null);
  };

  const handleConfirmBuy = async () => {
    if (!selectedTicket) return;
    const listingId = selectedTicket.listingId ?? selectedTicket.id;
    setBuyLoading(true);
    try {
      const res = await marketplaceApi.createTrade(listingId);
      const data = res.data;
      setPaymentInfo({
        qrCode: data.qrCode,
        checkoutUrl: data.checkoutUrl,
        amount: data.amount,
        tradeId: data.tradeId,
        payosOrderCode: data.payosOrderCode,
      });

      const started = Date.now();
      const poll = async () => {
        if (Date.now() - started > 15 * 60 * 1000) return;
        try {
          const t = await marketplaceApi.getTrade(data.tradeId);
          if (
            t.data.trade.escrowStatus === "HELD" ||
            t.data.trade.escrowStatus === "RELEASED"
          ) {
            setBuySuccess(true);
            setTimeout(() => {
              setIsBuyModalOpen(false);
              navigate("/my-tickets?p2p=success");
            }, 1600);
            return;
          }
        } catch {
          /* keep polling */
        }
        setTimeout(poll, 2500);
      };
      setTimeout(poll, 2500);
    } catch (err: any) {
      toast.error(err?.message || "Không tạo được giao dịch P2P");
    } finally {
      setBuyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] pb-16 pt-8 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải vé pass…
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-[#12131A]/60 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-base font-bold text-white">
              Không tìm thấy vé pass phù hợp
            </p>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm">
              Hãy là người đầu tiên đăng bán vé cho sự kiện này.
            </p>
            <Button
              onClick={() => {
                setSelectedZone("all");
                setSearchQuery("");
              }}
              variant="outline"
              className="mt-4 text-xs border-zinc-700 text-zinc-300 hover:text-white"
            >
              Xem tất cả ({eventTickets.length})
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

        <BuyP2PModal
          ticket={selectedTicket}
          isOpen={isBuyModalOpen}
          onClose={() => {
            setIsBuyModalOpen(false);
            setPaymentInfo(null);
          }}
          onConfirmBuy={handleConfirmBuy}
          isSuccess={buySuccess}
          isLoading={buyLoading}
          paymentInfo={paymentInfo}
        />

        <PostTicketModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onSuccess={() => void loadOffers()}
        />
      </div>
    </div>
  );
}
