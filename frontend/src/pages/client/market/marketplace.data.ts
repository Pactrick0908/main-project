export interface MarketplaceTicket {
  id: number;
  listingId?: number;
  ticketId?: number;
  eventId: number;
  title: string;
  category: string;
  artist: string;
  image: string;
  date: string;
  location: string;
  seatZone: string;
  seller: string;
  sellerAvatar?: string;
  sellerRating?: number;
  sellerSuccessCount?: number;
  sellerNote: string;
  originalPrice: string;
  passPrice: string;
  solPrice?: string;
  verified: boolean;
  createdAt?: string;
}

export const CATEGORIES = [
  { id: "all", name: "Tất cả" },
  { id: "vpop", name: "V-Pop" },
  { id: "kpop", name: "K-Pop" },
  { id: "rap", name: "Rap / Hip-Hop" },
  { id: "indie", name: "Indie & Rock" },
  { id: "edm", name: "EDM / Festival" },
];

/** Data thật lấy từ marketplaceApi — mock rỗng */
export const MARKETPLACE_TICKETS: MarketplaceTicket[] = [];

export function listingToMarketplaceTicket(l: {
  id: number;
  listingId?: number;
  ticketId?: number;
  eventId: number;
  title: string;
  category: string;
  artist: string;
  image: string;
  date: string;
  location: string;
  seatZone: string;
  seller: string;
  sellerAvatar?: string;
  sellerNote: string;
  originalPrice: string;
  passPrice: string;
  verified: boolean;
  createdAt?: string;
}): MarketplaceTicket {
  return {
    id: l.id,
    listingId: l.listingId ?? l.id,
    ticketId: l.ticketId,
    eventId: l.eventId,
    title: l.title,
    category: l.category,
    artist: l.artist,
    image: l.image,
    date: l.date,
    location: l.location,
    seatZone: l.seatZone,
    seller: l.seller,
    sellerAvatar: l.sellerAvatar,
    sellerNote: l.sellerNote,
    originalPrice: l.originalPrice,
    passPrice: l.passPrice,
    verified: l.verified,
    createdAt: l.createdAt,
  };
}

export interface ConcertResaleSummary {
  eventId: number;
  title: string;
  artist: string;
  category: string;
  image: string;
  date: string;
  location: string;
  passCount: number;
  minPassPrice: string;
  minPriceNumber: number;
  originalPriceRange: string;
  maxDiscountPercent: number;
  zonesAvailable: string[];
}

export function getResaleTicketsByEventId(
  eventId: number,
  tickets: MarketplaceTicket[] = MARKETPLACE_TICKETS,
): MarketplaceTicket[] {
  return tickets.filter((t) => t.eventId === eventId);
}

export function getConcertsWithResale(
  tickets: MarketplaceTicket[] = MARKETPLACE_TICKETS,
): ConcertResaleSummary[] {
  const map = new Map<number, MarketplaceTicket[]>();

  tickets.forEach((ticket) => {
    if (!map.has(ticket.eventId)) map.set(ticket.eventId, []);
    map.get(ticket.eventId)!.push(ticket);
  });

  const summaries: ConcertResaleSummary[] = [];

  map.forEach((group, eventId) => {
    if (group.length === 0) return;
    const first = group[0];

    let minPass = Infinity;
    let minPassFormatted = first.passPrice;
    let maxDiscount = 0;
    const zonesSet = new Set<string>();

    group.forEach((t) => {
      const passNum = parseInt(t.passPrice.replace(/\D/g, ""), 10) || 0;
      const origNum =
        parseInt(t.originalPrice.replace(/\D/g, ""), 10) || passNum;

      if (passNum < minPass && passNum > 0) {
        minPass = passNum;
        minPassFormatted = t.passPrice;
      }

      if (origNum > passNum && origNum > 0) {
        const discount = Math.round(((origNum - passNum) / origNum) * 100);
        if (discount > maxDiscount) maxDiscount = discount;
      }

      const zoneName = t.seatZone.split("—")[0].trim().split("·")[0].trim();
      zonesSet.add(zoneName);
    });

    summaries.push({
      eventId,
      title: first.title,
      artist: first.artist,
      category: first.category,
      image: first.image,
      date: first.date,
      location: first.location,
      passCount: group.length,
      minPassPrice: minPassFormatted,
      minPriceNumber: minPass === Infinity ? 0 : minPass,
      originalPriceRange: first.originalPrice,
      maxDiscountPercent: maxDiscount,
      zonesAvailable: Array.from(zonesSet),
    });
  });

  return summaries;
}
