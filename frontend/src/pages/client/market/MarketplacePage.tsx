import { useState, useMemo } from "react";
import {
  MARKETPLACE_TICKETS,
  getConcertsWithResale,
  type MarketplaceTicket,
} from "./marketplace.data";

// Sub-components
import MarketplaceHero from "./MarketplaceHero";
import MarketplaceFilterBar from "./MarketplaceFilterBar";
import MarketplaceCard from "./MarketplaceCard";
import ConcertResaleCard from "./ConcertResaleCard";
import PostTicketModal from "./PostTicketModal";
import BuyP2PModal from "./BuyP2PModal";
import { Music, Ticket as TicketIcon } from "lucide-react";

export default function MarketplacePage() {
  const [viewMode, setViewMode] = useState<"concerts" | "all-tickets">("concerts");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // State Modals
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MarketplaceTicket | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);

  // Danh sách concert có người pass
  const concertSummaries = useMemo(() => {
    return getConcertsWithResale();
  }, []);

  // Lọc concert
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
      .sort((a, b) => {
        return sortOrder === "asc"
          ? a.minPriceNumber - b.minPriceNumber
          : b.minPriceNumber - a.minPriceNumber;
      });
  }, [concertSummaries, selectedCategory, searchQuery, sortOrder]);

  // Lọc vé lẻ
  const filteredTickets = useMemo(() => {
    return MARKETPLACE_TICKETS.filter((ticket) => {
      const matchCat =
        selectedCategory === "all" || ticket.category === selectedCategory;
      const matchSearch =
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.seller.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSearch;
    }).sort((a, b) => {
      const pa = parseInt(a.passPrice.replace(/\D/g, ""), 10) || 0;
      const pb = parseInt(b.passPrice.replace(/\D/g, ""), 10) || 0;
      return sortOrder === "asc" ? pa - pb : pb - pa;
    });
  }, [selectedCategory, searchQuery, sortOrder]);

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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 min-h-screen">
      {/* 1. Header Hero */}
      <MarketplaceHero onOpenListModal={() => setIsListModalOpen(true)} />

      {/* 2. View Mode Tabs */}
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
            Tất cả người pass ({MARKETPLACE_TICKETS.length} vé)
          </button>
        </div>

        <div className="text-xs text-zinc-500 hidden sm:block">
          {viewMode === "concerts"
            ? "Bấm vào concert để xem đầy đủ danh sách người đang pass vé"
            : "Mua trực tiếp từng vé đơn lẻ từ cộng đồng"}
        </div>
      </div>

      {/* 3. Filter Bar */}
      <MarketplaceFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        sortOrder={sortOrder}
        onToggleSort={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
      />

      {/* 4. Display according to viewMode */}
      {viewMode === "concerts" ? (
        filteredConcerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
            <p className="text-zinc-400 text-sm">Không tìm thấy concert nào phù hợp</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredConcerts.map((concert) => (
              <ConcertResaleCard key={concert.eventId} concert={concert} />
            ))}
          </div>
        )
      ) : (
        filteredTickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
            <p className="text-zinc-400 text-sm">Không tìm thấy vé phù hợp</p>
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
        )
      )}

      {/* 5. Modals */}
      <PostTicketModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onSuccess={() => {}}
      />

      <BuyP2PModal
        ticket={selectedTicket}
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onConfirmBuy={handleConfirmBuy}
        isSuccess={buySuccess}
      />
    </div>
  );
}
