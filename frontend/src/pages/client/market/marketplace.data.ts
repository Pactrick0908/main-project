export interface MarketplaceTicket {
  id: number;
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

export const MARKETPLACE_TICKETS: MarketplaceTicket[] = [
  // ==================== CONCERT 1: ANH TRAI SAY HI ====================
  {
    id: 1,
    eventId: 1,
    title: "Anh Trai Say Hi 2026 — The Final Concert Night 3",
    category: "vpop",
    artist: "Dàn Cast Anh Trai Say Hi",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    date: "20:00 · 28/09/2026",
    location: "SVĐ Mỹ Đình, Hà Nội",
    seatZone: "Fanzone A1 — Đứng cận sân khấu",
    seller: "alex_tran",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=alex",
    sellerRating: 4.9,
    sellerSuccessCount: 8,
    sellerNote: "Đi công tác đột xuất, pass lại bằng giá mua gốc cho ai nhiệt tình.",
    originalPrice: "2.500.000đ",
    passPrice: "2.500.000đ",
    verified: true,
    createdAt: "10 phút trước",
  },
  {
    id: 101,
    eventId: 1,
    title: "Anh Trai Say Hi 2026 — The Final Concert Night 3",
    category: "vpop",
    artist: "Dàn Cast Anh Trai Say Hi",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    date: "20:00 · 28/09/2026",
    location: "SVĐ Mỹ Đình, Hà Nội",
    seatZone: "SVIP Say Hi Lounge",
    seller: "hoang_minh",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=hoang",
    sellerRating: 5.0,
    sellerSuccessCount: 14,
    sellerNote: "Pass lỗ nhanh do đổi kế hoạch du lịch cùng gia đình, vé chính chủ kèm set quà.",
    originalPrice: "3.500.000đ",
    passPrice: "3.100.000đ",
    verified: true,
    createdAt: "25 phút trước",
  },
  {
    id: 102,
    eventId: 1,
    title: "Anh Trai Say Hi 2026 — The Final Concert Night 3",
    category: "vpop",
    artist: "Dàn Cast Anh Trai Say Hi",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    date: "20:00 · 28/09/2026",
    location: "SVĐ Mỹ Đình, Hà Nội",
    seatZone: "Khán đài CAT 1 (Ngồi)",
    seller: "thanh_vy",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=vy",
    sellerRating: 4.8,
    sellerSuccessCount: 5,
    sellerNote: "Dư 1 vé do bạn cùng phòng bận lịch thi cử không đi được.",
    originalPrice: "1.800.000đ",
    passPrice: "1.650.000đ",
    verified: true,
    createdAt: "1 giờ trước",
  },
  {
    id: 103,
    eventId: 1,
    title: "Anh Trai Say Hi 2026 — The Final Concert Night 3",
    category: "vpop",
    artist: "Dàn Cast Anh Trai Say Hi",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    date: "20:00 · 28/09/2026",
    location: "SVĐ Mỹ Đình, Hà Nội",
    seatZone: "Khán đài CAT 2 (Ngồi)",
    seller: "nam_khanh",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=khanh",
    sellerRating: 4.9,
    sellerSuccessCount: 9,
    sellerNote: "Pass lẹ có thương lượng nhẹ, vé chuyển ngay sau khi xác nhận thanh toán ký quỹ.",
    originalPrice: "1.200.000đ",
    passPrice: "1.100.000đ",
    verified: true,
    createdAt: "3 giờ trước",
  },

  // ==================== CONCERT 2: BLACKPINK ====================
  {
    id: 2,
    eventId: 2,
    title: "BLACKPINK World Tour [BORN PINK] En-core Live in Saigon",
    category: "kpop",
    artist: "BLACKPINK",
    image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80",
    date: "19:30 · 15/10/2026",
    location: "SVĐ Quân Khu 7, TP. HCM",
    seatZone: "VIP Soundcheck Package",
    seller: "blink_saigon",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=blink",
    sellerRating: 5.0,
    sellerSuccessCount: 19,
    sellerNote: "Mua dư 1 vé cho bạn nhưng bạn bận thi cử, pass lại giá ưu đãi cho Blink chân chính.",
    originalPrice: "8.500.000đ",
    passPrice: "7.800.000đ",
    verified: true,
    createdAt: "30 phút trước",
  },
  {
    id: 201,
    eventId: 2,
    title: "BLACKPINK World Tour [BORN PINK] En-core Live in Saigon",
    category: "kpop",
    artist: "BLACKPINK",
    image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80",
    date: "19:30 · 15/10/2026",
    location: "SVĐ Quân Khu 7, TP. HCM",
    seatZone: "Platinum Standing (Sát sân khấu)",
    seller: "jennie_fan",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=jennie",
    sellerRating: 4.9,
    sellerSuccessCount: 7,
    sellerNote: "Vị trí sát sàn catwalk ngắm idol cực nét, hỗ trợ check-in tại cổng.",
    originalPrice: "5.500.000đ",
    passPrice: "5.200.000đ",
    verified: true,
    createdAt: "2 giờ trước",
  },
  {
    id: 202,
    eventId: 2,
    title: "BLACKPINK World Tour [BORN PINK] En-core Live in Saigon",
    category: "kpop",
    artist: "BLACKPINK",
    image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80",
    date: "19:30 · 15/10/2026",
    location: "SVĐ Quân Khu 7, TP. HCM",
    seatZone: "CAT 1 Seated (Khán đài A/B)",
    seller: "kpop_collector",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=collector",
    sellerRating: 4.7,
    sellerSuccessCount: 11,
    sellerNote: "Ghế ngồi tầng 1 chính diện sân khấu không lo che khuất tầm nhìn.",
    originalPrice: "3.500.000đ",
    passPrice: "3.300.000đ",
    verified: true,
    createdAt: "4 giờ trước",
  },

  // ==================== CONCERT 3: SEE SING SHARE ====================
  {
    id: 6,
    eventId: 3,
    title: "See Sing Share 2026: Chân Trời Rực Rỡ",
    category: "vpop",
    artist: "Hà Anh Tuấn",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    date: "19:00 · 05/11/2026",
    location: "Trung tâm Hội nghị Đà Lạt",
    seatZone: "Hạng Hoa Hồng (VIP)",
    seller: "dalat_lover",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dalat",
    sellerRating: 5.0,
    sellerSuccessCount: 6,
    sellerNote: "Pass lại đúng giá cho người mê nhạc Hà Anh Tuấn tại xứ sở sương mù.",
    originalPrice: "5.000.000đ",
    passPrice: "4.800.000đ",
    verified: true,
    createdAt: "15 phút trước",
  },
  {
    id: 301,
    eventId: 3,
    title: "See Sing Share 2026: Chân Trời Rực Rỡ",
    category: "vpop",
    artist: "Hà Anh Tuấn",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    date: "19:00 · 05/11/2026",
    location: "Trung tâm Hội nghị Đà Lạt",
    seatZone: "Hạng Đồi Thông",
    seller: "acoustic_soul",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=acoustic",
    sellerRating: 4.8,
    sellerSuccessCount: 4,
    sellerNote: "Kèm voucher tiệc trà và postcard có chữ ký tặng.",
    originalPrice: "3.200.000đ",
    passPrice: "3.000.000đ",
    verified: true,
    createdAt: "1 ngày trước",
  },
  {
    id: 302,
    eventId: 3,
    title: "See Sing Share 2026: Chân Trời Rực Rỡ",
    category: "vpop",
    artist: "Hà Anh Tuấn",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    date: "19:00 · 05/11/2026",
    location: "Trung tâm Hội nghị Đà Lạt",
    seatZone: "Hạng Mây Trắng",
    seller: "saigon_tripper",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=tripper",
    sellerRating: 4.9,
    sellerSuccessCount: 3,
    sellerNote: "Không thu xếp được chuyến bay nên để lại giá hạt dẻ.",
    originalPrice: "2.000.000đ",
    passPrice: "1.850.000đ",
    verified: true,
    createdAt: "2 ngày trước",
  },

  // ==================== CONCERT 4: ULTRA MUSIC FESTIVAL ====================
  {
    id: 4,
    eventId: 4,
    title: "Ultra Music Festival Vietnam — Electric Dance Horizon",
    category: "edm",
    artist: "Martin Garrix, Hardwell, KSHMR",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
    date: "15:00 · 24/12/2026",
    location: "KĐT Sala, TP. Thủ Đức",
    seatZone: "PGA (Premium General Admission)",
    seller: "edm_raver",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=raver",
    sellerRating: 4.6,
    sellerSuccessCount: 12,
    sellerNote: "Nhóm bạn đổi lịch đi tour Tây Bắc mùa Noel nên pass trọn gói.",
    originalPrice: "3.200.000đ",
    passPrice: "2.850.000đ",
    verified: true,
    createdAt: "45 phút trước",
  },
  {
    id: 401,
    eventId: 4,
    title: "Ultra Music Festival Vietnam — Electric Dance Horizon",
    category: "edm",
    artist: "Martin Garrix, Hardwell, KSHMR",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
    date: "15:00 · 24/12/2026",
    location: "KĐT Sala, TP. Thủ Đức",
    seatZone: "GA (General Admission - Vé thường)",
    seller: "trance_vibe",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=trance",
    sellerRating: 4.8,
    sellerSuccessCount: 8,
    sellerNote: "Vé chính chủ bảo mật, pass rẻ lấy tương tác.",
    originalPrice: "1.600.000đ",
    passPrice: "1.400.000đ",
    verified: true,
    createdAt: "2 giờ trước",
  },

  // ==================== CONCERT 5: RAP VIET ====================
  {
    id: 3,
    eventId: 5,
    title: "Rap Việt All-Star Live Concert 2026",
    category: "rap",
    artist: "Suboi, Karik, JustaTee, B Ray",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80",
    date: "19:00 · 12/12/2026",
    location: "SECC, Quận 7, TP. HCM",
    seatZone: "GA Sàn Nhảy — Vị trí trung tâm",
    seller: "hiphop_head",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=hiphop",
    sellerRating: 4.9,
    sellerSuccessCount: 5,
    sellerNote: "Cần tiền gấp, bớt chút lộc cho anh em chung đam mê hiphop.",
    originalPrice: "1.200.000đ",
    passPrice: "1.050.000đ",
    verified: true,
    createdAt: "5 giờ trước",
  },

  // ==================== CONCERT 6: NHỮNG THÀNH PHỐ MƠ MÀNG ====================
  {
    id: 5,
    eventId: 6,
    title: "Những Thành Phố Mơ Màng Year-End Music Festival",
    category: "indie",
    artist: "Vũ, Chillies, Ngọt, Đen Vâu",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
    date: "16:00 · 20/11/2026",
    location: "Công viên Yên Sở, Hà Nội",
    seatZone: "Vé Thường — Đã gồm quà tặng túi vải",
    seller: "indie_vibes",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=indie",
    sellerRating: 5.0,
    sellerSuccessCount: 9,
    sellerNote: "Trùng lịch chụp ảnh cưới nên pass lại, tặng luôn set quà đi kèm.",
    originalPrice: "750.000đ",
    passPrice: "680.000đ",
    verified: true,
    createdAt: "1 ngày trước",
  },
  {
    id: 601,
    eventId: 6,
    title: "Những Thành Phố Mơ Màng Year-End Music Festival",
    category: "indie",
    artist: "Vũ, Chillies, Ngọt, Đen Vâu",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
    date: "16:00 · 20/11/2026",
    location: "Công viên Yên Sở, Hà Nội",
    seatZone: "Vé VIP — Ghế lều dã ngoại riêng",
    seller: "chillies_club",
    sellerAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=chillies",
    sellerRating: 4.8,
    sellerSuccessCount: 7,
    sellerNote: "Khu vực lều riêng ngắm hoàng hôn cực chill.",
    originalPrice: "1.200.000đ",
    passPrice: "1.100.000đ",
    verified: true,
    createdAt: "2 ngày trước",
  },
];

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

/**
 * Lấy danh sách tất cả vé pass của 1 concert cụ thể theo eventId
 */
export function getResaleTicketsByEventId(eventId: number): MarketplaceTicket[] {
  return MARKETPLACE_TICKETS.filter((t) => t.eventId === eventId);
}

/**
 * Lấy danh sách các concert đang có người pass vé (được gom nhóm lại)
 */
export function getConcertsWithResale(): ConcertResaleSummary[] {
  const map = new Map<number, MarketplaceTicket[]>();

  MARKETPLACE_TICKETS.forEach((ticket) => {
    if (!map.has(ticket.eventId)) {
      map.set(ticket.eventId, []);
    }
    map.get(ticket.eventId)!.push(ticket);
  });

  const summaries: ConcertResaleSummary[] = [];

  map.forEach((tickets, eventId) => {
    if (tickets.length === 0) return;
    const first = tickets[0];

    // Tính giá pass nhỏ nhất
    let minPass = Infinity;
    let minPassFormatted = first.passPrice;
    let maxDiscount = 0;
    const zonesSet = new Set<string>();

    tickets.forEach((t) => {
      const passNum = parseInt(t.passPrice.replace(/\D/g, ""), 10) || 0;
      const origNum = parseInt(t.originalPrice.replace(/\D/g, ""), 10) || passNum;

      if (passNum < minPass && passNum > 0) {
        minPass = passNum;
        minPassFormatted = t.passPrice;
      }

      if (origNum > passNum && origNum > 0) {
        const discount = Math.round(((origNum - passNum) / origNum) * 100);
        if (discount > maxDiscount) maxDiscount = discount;
      }

      // Zone name rút gọn
      const zoneName = t.seatZone.split("—")[0].trim();
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
      passCount: tickets.length,
      minPassPrice: minPassFormatted,
      minPriceNumber: minPass === Infinity ? 0 : minPass,
      originalPriceRange: first.originalPrice,
      maxDiscountPercent: maxDiscount,
      zonesAvailable: Array.from(zonesSet),
    });
  });

  return summaries;
}
