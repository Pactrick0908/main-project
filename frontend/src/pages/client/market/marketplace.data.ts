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
  tickets: MarketplaceTicket[],
  eventId: number,
): MarketplaceTicket[] {
  return tickets.filter((t) => t.eventId === eventId);
}

export function getConcertsWithResale(
  tickets: MarketplaceTicket[],
): ConcertResaleSummary[] {
  const map = new Map<number, MarketplaceTicket[]>();

  tickets.forEach((ticket) => {
    const list = map.get(ticket.eventId) ?? [];
    list.push(ticket);
    map.set(ticket.eventId, list);
  });

  const summaries: ConcertResaleSummary[] = [];

  map.forEach((group, eventId) => {
    if (group.length === 0) return;
    const first = group[0];
    if (!first) return;

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

      const zoneName = t.seatZone.split(/[—·]/)[0]?.trim() || t.seatZone;
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
