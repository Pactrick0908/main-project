import { useState, useMemo, useEffect, useCallback } from "react";
import {
  getConcertsWithResale,
  type MarketplaceTicket,
} from "./marketplace.data";
import { listingToTicket, marketplaceApi } from "@/api/marketplace.api";

import MarketplaceHero from "./MarketplaceHero";
import MarketplaceFilterBar from "./MarketplaceFilterBar";
import MarketplaceCard from "./MarketplaceCard";
import ConcertResaleCard from "./ConcertResaleCard";
import PostTicketModal from "./PostTicketModal";
import BuyP2PModal from "./BuyP2PModal";
import { Music, Ticket as TicketIcon } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function MarketplacePage() {
  const [viewMode, setViewMode] = useState<"concerts" | "all-tickets">(
    "concerts",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [tickets, setTickets] = useState<MarketplaceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] =
    useState<MarketplaceTicket | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  const loadListings = useCallback(async () => {
    setError(null);
    try {
      const res = await marketplaceApi.listListings(
        searchQuery.trim() ? { q: searchQuery.trim() } : undefined,
      );
      setTickets((res.data.listings ?? []).map(listingToTicket));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được chợ vé");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    void loadListings();
  }, [loadListings]);

  const concertSummaries = useMemo(
    () => getConcertsWithResale(tickets),
    [tickets],
  );

  const filteredConcerts = useMemo(() => {
    return concertSummaries
      .filter((concert) => {
        return (
          concert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          concert.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          concert.location.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
      .sort((a, b) => {
        return sortOrder === "asc"
          ? a.minPriceNumber - b.minPriceNumber
          : b.minPriceNumber - a.minPriceNumber;
      });
  }, [concertSummaries, searchQuery, sortOrder]);

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((ticket) => {
        return (
          ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.seller.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
      .sort((a, b) => {
        const pa = parseInt(a.passPrice.replace(/\D/g, ""), 10) || 0;
        const pb = parseInt(b.passPrice.replace(/\D/g, ""), 10) || 0;
        return sortOrder === "asc" ? pa - pb : pb - pa;
      });
  }, [tickets, searchQuery, sortOrder]);

  const handleOpenBuy = (ticket: MarketplaceTicket) => {
    setSelectedTicket(ticket);
    setIsBuyModalOpen(true);
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
                ? "bg-[#F97316] text-white shadow-md shadow-orange-500/20"
                : "border border-zinc-800 bg-[#12131A] text-zinc-400 hover:border-zinc-700 hover:text-white"
            }`}
          >
            <Music className="h-3.5 w-3.5" />
            Theo Concert / Sự kiện ({concertSummaries.length})
          </button>

          <button
            type="button"
            onClick={() => setViewMode("all-tickets")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "all-tickets"
                ? "bg-[#F97316] text-white shadow-md shadow-orange-500/20"
                : "border border-zinc-800 bg-[#12131A] text-zinc-400 hover:border-zinc-700 hover:text-white"
            }`}
          >
            <TicketIcon className="h-3.5 w-3.5" />
            Tất cả người pass ({tickets.length} vé)
          </button>
        </div>

        <div className="text-xs text-zinc-500 hidden sm:block">
          {viewMode === "concerts"
            ? "Bấm vào concert để xem đầy đủ danh sách người đang pass vé"
            : "Mua trực tiếp từng vé đơn lẻ từ cộng đồng"}
        </div>
      </div>

      <MarketplaceFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onToggleSort={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
      />

      {loading ? (
        <LoadingSpinner label="Đang tải chợ vé…" className="min-h-[16rem]" />
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center text-sm text-red-400">
          {error}
        </div>
      ) : viewMode === "concerts" ? (
        filteredConcerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
            <p className="text-zinc-400 text-sm">
              Chưa có concert nào đang được pass vé
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredConcerts.map((concert) => (
              <ConcertResaleCard key={concert.eventId} concert={concert} />
            ))}
          </div>
        )
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
          <p className="text-zinc-400 text-sm">Chưa có vé pass nào phù hợp</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((ticket) => (
            <MarketplaceCard
              key={ticket.id}
              ticket={ticket}
              onSelectBuy={handleOpenBuy}
            />
          ))}
        </div>
      )}

      <PostTicketModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onSuccess={() => void loadListings()}
      />

      <BuyP2PModal
        ticket={selectedTicket}
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onPurchased={() => void loadListings()}
      />
    </div>
  );
}
