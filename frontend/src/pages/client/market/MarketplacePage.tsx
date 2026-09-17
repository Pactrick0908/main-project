import { useState, useMemo, useEffect, useCallback } from "react";
import {
  getConcertsWithResale,
  listingToMarketplaceTicket,
  type MarketplaceTicket,
} from "./marketplace.data";
import {
  marketplaceApi,
  type MarketplaceListingDto,
} from "@/api/marketplace.api";

import MarketplaceHero from "./MarketplaceHero";
import MarketplaceFilterBar from "./MarketplaceFilterBar";
import MarketplaceCard from "./MarketplaceCard";
import ConcertResaleCard from "./ConcertResaleCard";
import PostTicketModal from "./PostTicketModal";
import BuyP2PModal from "./BuyP2PModal";
import { Music, Ticket as TicketIcon, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { useNavigate } from "react-router-dom";

export default function MarketplacePage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"concerts" | "all-tickets">(
    "concerts",
  );
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [listings, setListings] = useState<MarketplaceTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] =
    useState<MarketplaceTicket | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    qrCode: string;
    checkoutUrl: string;
    amount: number;
    tradeId: number;
    payosOrderCode: number;
  } | null>(null);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marketplaceApi.listListings({
        q: searchQuery || undefined,
      });
      const mapped = (res.data?.listings || []).map((l: MarketplaceListingDto) =>
        listingToMarketplaceTicket(l),
      );
      setListings(mapped);
    } catch (err: any) {
      toast.error(err?.message || "Không tải được chợ vé");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const concertSummaries = useMemo(
    () => getConcertsWithResale(listings),
    [listings],
  );

  const filteredConcerts = useMemo(() => {
    return concertSummaries
      .filter((concert) => {
        const matchCat =
          selectedCategory === "all" ||
          concert.category.toLowerCase().includes(selectedCategory.toLowerCase());
        const matchSearch =
          concert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          concert.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          concert.location.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
      })
      .sort((a, b) =>
        sortOrder === "asc"
          ? a.minPriceNumber - b.minPriceNumber
          : b.minPriceNumber - a.minPriceNumber,
      );
  }, [concertSummaries, selectedCategory, searchQuery, sortOrder]);

  const filteredTickets = useMemo(() => {
    return listings
      .filter((ticket) => {
        const matchCat =
          selectedCategory === "all" || ticket.category === selectedCategory;
        const matchSearch =
          ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.seller.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
      })
      .sort((a, b) => {
        const pa = parseInt(a.passPrice.replace(/\D/g, ""), 10) || 0;
        const pb = parseInt(b.passPrice.replace(/\D/g, ""), 10) || 0;
        return sortOrder === "asc" ? pa - pb : pb - pa;
      });
  }, [listings, selectedCategory, searchQuery, sortOrder]);

  const handleOpenBuy = (ticket: MarketplaceTicket) => {
    setSelectedTicket(ticket);
    setIsBuyModalOpen(true);
    setBuySuccess(false);
    setPaymentInfo(null);
  };

  const handleConfirmBuy = async () => {
    if (!selectedTicket?.listingId && !selectedTicket?.id) return;
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

      // Poll đến HELD
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 min-h-screen">
      <MarketplaceHero onOpenListModal={() => setIsListModalOpen(true)} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("concerts")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "concerts"
                ? "bg-[#F97316] text-white"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            <Music className="h-3.5 w-3.5" />
            Theo concert
          </button>
          <button
            type="button"
            onClick={() => setViewMode("all-tickets")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "all-tickets"
                ? "bg-[#F97316] text-white"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            <TicketIcon className="h-3.5 w-3.5" />
            Tất cả vé pass
          </button>
        </div>
      </div>

      <MarketplaceFilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onToggleSort={() =>
          setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-400 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải chợ vé…
        </div>
      ) : viewMode === "concerts" ? (
        filteredConcerts.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 py-16">
            Chưa có vé nào đang bán. Hãy đăng bán vé của bạn!
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredConcerts.map((c) => (
              <ConcertResaleCard key={c.eventId} concert={c} />
            ))}
          </div>
        )
      ) : filteredTickets.length === 0 ? (
        <p className="text-center text-sm text-zinc-500 py-16">
          Không có vé pass phù hợp bộ lọc.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((ticket) => (
            <MarketplaceCard
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
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onSuccess={() => void loadListings()}
      />
    </div>
  );
}
