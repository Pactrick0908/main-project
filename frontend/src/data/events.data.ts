export interface EventZone {
  id: string;
  name: string;
  price: number;
  solPrice: number;
  available: number;
  color: string;
  benefits: string[];
  /** Tổng ghế khu vực — lấy từ EventZone.totalSeats trên DB */
  totalSeats?: number;
  /** Số hàng ghế — lấy từ event_zones.row */
  rowCount?: number;
  /** Ghế đã bán (có ticket gắn seatId) — ẩn trên sơ đồ */
  soldSeats?: string[];
}

export interface DetailedEvent {
  id: number;
  title: string;
  artist: string;
  category: string;
  bannerImage: string;
  thumbnail: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  city: string;
  description: string;
  organizer: string;
  /** Ảnh logo nhà tổ chức */
  logoUrl?: string;
  /** Ảnh sơ đồ chỗ ngồi */
  mapUrl?: string;
  ticketsAvailable: boolean;
  zones: EventZone[];
  rules: string[];
}

export const EVENTS_DATA: Record<number, DetailedEvent> = {
  1: {
    id: 1,
    title: "Anh Trai Say Hi 2026 — The Final Concert Night 3",
    artist: "Dàn Cast Anh Trai Say Hi (HIEUTHUHAI, Rhyder, Quang Hùng MasterD,...)",
    category: "V-Pop",
    bannerImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    date: "Thứ Bảy, 28/09/2026",
    time: "20:00 (Mở cổng 17:30)",
    venue: "Sân vận động Quốc gia Mỹ Đình",
    address: "Đường Lê Đức Thọ, Phường Mỹ Đình 1, Nam Từ Liêm",
    city: "Hà Nội",
    description: `Đêm concert cuối cùng và bùng nổ nhất của hành trình Anh Trai Say Hi 2026. Hơn 30 nghệ sĩ biểu diễn live cùng dàn âm thanh ánh sáng chuẩn quốc tế. Toàn bộ vé phát hành chính hãng có mã định danh số chống giả, check-in qua Dynamic QR code xoay vòng 60 giây chống chụp màn hình và vé chợ đen.`,
    organizer: "Vie Channel & Ban Tổ Chức",
    ticketsAvailable: true,
    zones: [
      {
        id: "svip",
        name: "SVIP Say Hi Lounge",
        price: 3500000,
        solPrice: 0.72,
        available: 45,
        color: "#F97316",
        benefits: ["Ghế ngồi sát sân khấu chính", "Set quà độc quyền Lightstick + Áo merch", "Check-in lối đi VIP riêng", "Fast-track đồ uống miễn phí"],
      },
      {
        id: "vip",
        name: "VIP Golden Circle (Đứng)",
        price: 2500000,
        solPrice: 0.51,
        available: 120,
        color: "#EAB308",
        benefits: ["Khu vực đứng sát sàn catwalk", "Lối vào ưu tiên", "Bao gồm vòng tay vải RFID lưu niệm"],
      },
      {
        id: "cat1",
        name: "Khán đài CAT 1 (Ngồi)",
        price: 1800000,
        solPrice: 0.37,
        available: 230,
        color: "#3B82F6",
        benefits: ["Ghế ngồi cố định tầng 1 có mái che", "Tầm nhìn toàn cảnh sân khấu chính"],
      },
      {
        id: "cat2",
        name: "Khán đài CAT 2 (Ngồi)",
        price: 1200000,
        solPrice: 0.25,
        available: 410,
        color: "#10B981",
        benefits: ["Ghế ngồi tầng 2", "Màn hình LED lớn hỗ trợ góc nhìn"],
      },
    ],
    rules: [
      "Vé sau khi thanh toán thành công sẽ được cập nhật ngay vào mục Vé của tôi trên ứng dụng.",
      "Mã QR check-in là mã động (Dynamic QR) đổi mới mỗi 60 giây, chỉ hiển thị hợp lệ trên ứng dụng.",
      "Không chấp nhận ảnh chụp màn hình hoặc video quay lại mã QR.",
      "Có thể chuyển nhượng an toàn trên Chợ vé P2P có hệ thống ký quỹ bảo chứng.",
    ],
  },
  2: {
    id: 2,
    title: "BLACKPINK World Tour [BORN PINK] En-core Live in Saigon",
    artist: "BLACKPINK (Jisoo, Jennie, Rosé, Lisa)",
    category: "K-Pop",
    bannerImage: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1600&q=80",
    thumbnail: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80",
    date: "Chủ Nhật, 15/10/2026",
    time: "19:30 (Mở cổng 16:30)",
    venue: "Sân vận động Quân Khu 7",
    address: "202 Hoàng Văn Thụ, Phường 9, Phú Nhuận",
    city: "TP. Hồ Chí Minh",
    description: "Đêm diễn encore đặc biệt thuộc tour diễn toàn cầu của nhóm nhạc nữ số 1 thế giới BLACKPINK tại TP. Hồ Chí Minh.",
    organizer: "YG Entertainment & IME Vietnam",
    ticketsAvailable: true,
    zones: [
      {
        id: "vip-soundcheck",
        name: "VIP Soundcheck Package",
        price: 8500000,
        solPrice: 1.75,
        available: 18,
        color: "#EC4899",
        benefits: ["Tham dự phần duyệt âm thanh (Soundcheck)", "Thẻ vé phiên bản Hologram kỉ niệm", "Thẻ đeo VIP kèm lanyard", "Lối vào sớm riêng biệt"],
      },
      {
        id: "platinum",
        name: "Platinum Standing (Sát sân khấu)",
        price: 5500000,
        solPrice: 1.13,
        available: 95,
        color: "#8B5CF6",
        benefits: ["Khu vực đứng gần nhất", "Vòng tay kỷ niệm"],
      },
      {
        id: "cat1-sg",
        name: "CAT 1 Seated (Khán đài A/B)",
        price: 3500000,
        solPrice: 0.72,
        available: 150,
        color: "#3B82F6",
        benefits: ["Ghế ngồi cố định", "Tầm nhìn thẳng sân khấu"],
      },
    ],
    rules: [
      "Quy định nghiêm ngặt: 1 tài khoản tối đa 2 vé.",
      "Dynamic QR bảo mật tự động hết hạn và tạo mới sau 60s.",
    ],
  },
  3: {
    id: 3,
    title: "See Sing Share 2026: Chân Trời Rực Rỡ",
    artist: "Hà Anh Tuấn & Khách mời đặc biệt",
    category: "V-Pop",
    bannerImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    date: "Thứ Bảy, 05/11/2026",
    time: "19:00",
    venue: "Trung tâm Hội nghị Quốc tế Đà Lạt",
    address: "Số 01 Trần Hưng Đạo",
    city: "Đà Lạt, Lâm Đồng",
    description: "Đêm nhạc lãng mạn giữa lòng thành phố sương mờ với những bản tình ca vượt thời gian của Hà Anh Tuấn.",
    organizer: "Viet Vision",
    ticketsAvailable: true,
    zones: [
      {
        id: "rose",
        name: "Hạng Hoa Hồng (VIP)",
        price: 5000000,
        solPrice: 1.02,
        available: 60,
        color: "#F43F5E",
        benefits: ["Ghế sofa nệm trung tâm", "Tiệc cocktail trà chiều trước giờ diễn", "Quà lưu niệm độc quyền"],
      },
      {
        id: "pine",
        name: "Hạng Đồi Thông",
        price: 3200000,
        solPrice: 0.65,
        available: 180,
        color: "#10B981",
        benefits: ["Ghế ngồi khán đài chính diện", "Bộ quà tặng postcard có chữ ký"],
      },
      {
        id: "cloud",
        name: "Hạng Mây Trắng",
        price: 2000000,
        solPrice: 0.41,
        available: 300,
        color: "#64748B",
        benefits: ["Ghế ngồi tiêu chuẩn", "Áo mưa sự kiện Đà Lạt"],
      },
    ],
    rules: [
      "Khuyến khích mặc trang phục màu trắng/be theo dresscode.",
      "Check-in qua mã Dynamic QR đổi mới liên tục chống vé giả tuyệt đối.",
    ],
  },
  4: {
    id: 4,
    title: "Ultra Music Festival Vietnam — Electric Dance Horizon",
    artist: "Martin Garrix, Hardwell, KSHMR, Alok",
    category: "EDM",
    bannerImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80",
    thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
    date: "Thứ Năm, 24/12/2026",
    time: "15:00 - 23:30",
    venue: "Khu đô thị Sala",
    address: "Mai Chí Thọ, Phường An Lợi Đông",
    city: "TP. Thủ Đức, TP. HCM",
    description: "Đại lễ hội âm nhạc điện tử quốc tế quy tụ các DJ trong top 100 DJ Mag cùng hệ thống pháo hoa Laser đỉnh cao.",
    organizer: "Ultra Worldwide & Ravolution",
    ticketsAvailable: true,
    zones: [
      {
        id: "pga",
        name: "PGA (Premium General Admission)",
        price: 3200000,
        solPrice: 0.65,
        available: 110,
        color: "#06B6D4",
        benefits: ["Lối vào riêng", "Khu vệ sinh & quầy bar có máy lạnh riêng", "Khu ngắm pháo hoa nâng cao"],
      },
      {
        id: "ga",
        name: "GA (General Admission - Vé thường)",
        price: 1600000,
        solPrice: 0.33,
        available: 600,
        color: "#EAB308",
        benefits: ["Toàn quyền vào khu vực sân khấu chính (Mainstage) và Worldwide Stage"],
      },
    ],
    rules: ["Sự kiện chỉ dành cho khán giả từ 18 tuổi trở lên mang theo CCCD/Hộ chiếu."],
  },
  99: {
    id: 99,
    title: "🧪 Vé Thử Nghiệm Thanh Toán PayOS (VietQR 2.000đ)",
    artist: "Hệ Thống Kiểm Thử Tự Động TicketFest",
    category: "Demo",
    bannerImage: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1600&q=80",
    thumbnail: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80",
    date: "Hôm nay · 24/7",
    time: "Mở thanh toán tức thì",
    venue: "Cổng Thanh Toán Trực Tuyến PayOS & VietQR",
    address: "Hệ thống bảo vệ ký quỹ người mua & check-in Dynamic QR",
    city: "Toàn Quốc",
    description: "Sự kiện được tạo để trải nghiệm và kiểm thử trọn vẹn luồng thanh toán thực tế bằng PayOS / VietQR (chỉ 2.000 VNĐ - mức tối thiểu liên ngân hàng Napas247). Bạn có thể dùng ứng dụng ngân hàng bất kỳ để quét mã QR và xác thực nhận vé tức thì.",
    organizer: "TicketFest Demo Sandbox",
    ticketsAvailable: true,
    zones: [
      {
        id: "test-zone",
        name: "Vé Test Thanh Toán VietQR (PayOS)",
        price: 2000,
        solPrice: 0.001,
        available: 999,
        color: "#10B981",
        benefits: [
          "Mã VietQR tự động khớp đơn 2.000đ",
          "Kích hoạt mã Dynamic QR xoay vòng ngay sau khi quét",
          "Tự động đồng bộ vào mục Vé Của Tôi",
          "Bảo đảm an toàn giao dịch 100%",
        ],
      },
    ],
    rules: [
      "Số tiền thanh toán là 2.000 VNĐ phục vụ mục đích kiểm thử hệ thống.",
      "Vé sau khi thanh toán thành công sẽ hiển thị trong mục 'Vé của tôi' kèm mã Dynamic QR xoay vòng 60s.",
    ],
  },
};
