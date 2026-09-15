import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Store,
  ArrowUpDown,
  Filter,
  ShieldCheck,
  Calendar,
  MapPin,
  Search,
  CheckCircle2,
  Ticket as TicketIcon,
  RefreshCw,
  MessageSquare,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface Ticket {
  id: number;
  title: string;
  category: string;
  artist: string;
  image: string;
  date: string;
  location: string;
  seatZone: string;
  seller: string;           // địa chỉ ví rút gọn
  sellerNote: string;       // lý do cần pass
  originalPrice: string;    // giá gốc mua từ BTC
  passPrice: string;        // giá người này muốn pass lại
  solPrice: string;
  verified: boolean;        // vé đã xác thực on-chain
}

// ─────────────────────────────────────────────
// DATA — Vé cộng đồng cần pass lại
// ─────────────────────────────────────────────
const TICKETS: Ticket[] = [
  {
    id: 1,
    title: "Anh Trai Say Hi 2026 — The Final Concert Night 3",
    category: "vpop",
    artist: "Dàn Cast Anh Trai Say Hi",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    date: "20:00 · 28/09/2026",
    location: "SVĐ Mỹ Đình, Hà Nội",
    seatZone: "Fanzone A1 — Đứng cận sân khấu",
    seller: "hoang_sol...89a2",
    sellerNote: "Bạn mình không đi được, mình pass lại đúng giá gốc",
    originalPrice: "2.200.000đ",
    passPrice: "1.950.000đ",
    solPrice: "0.52 SOL",
    verified: true,
  },
  {
    id: 2,
    title: "BLACKPINK World Tour [BORN PINK] En-core Live in Saigon",
    category: "kpop",
    artist: "BLACKPINK",
    image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80",
    date: "19:30 · 15/10/2026",
    location: "SVĐ Quân Khu 7, TP. HCM",
    seatZone: "VIP Soundcheck — Hàng 03 Ghế 18",
    seller: "lananh_pass...4f11",
    sellerNote: "Có việc bận đột xuất, nhượng lại không lời",
    originalPrice: "6.800.000đ",
    passPrice: "6.200.000đ",
    solPrice: "1.65 SOL",
    verified: true,
  },
  {
    id: 3,
    title: "See Sing Share 2026: Chân Trời Rực Rỡ Concert",
    category: "vpop",
    artist: "Hà Anh Tuấn",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    date: "19:00 · 05/11/2026",
    location: "TTHH Quốc tế, Đà Lạt",
    seatZone: "Hạng Bạch Kim — Khối B Hàng 8",
    seller: "tuan_music...90c4",
    sellerNote: "Mua 2 vé nhưng người đi cùng không đi được, pass lại 1",
    originalPrice: "3.500.000đ",
    passPrice: "3.100.000đ",
    solPrice: "0.82 SOL",
    verified: true,
  },
  {
    id: 4,
    title: "Những Thành Phố Mơ Màng Year-End Music Festival",
    category: "indie",
    artist: "Vũ, Chillies, Ngọt, Đen Vâu",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
    date: "16:00 · 20/11/2026",
    location: "Công viên Yên Sở, Hà Nội",
    seatZone: "GA Standard — Tự do toàn khu",
    seller: "dreamer_hanoi...b219",
    sellerNote: "Bất ngờ phải đi công tác đúng ngày, nhường lại",
    originalPrice: "750.000đ",
    passPrice: "690.000đ",
    solPrice: "0.18 SOL",
    verified: true,
  },
  {
    id: 5,
    title: "Rap Việt All-Star Live Concert 2026",
    category: "rap",
    artist: "Suboi, Karik, JustaTee, B Ray",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80",
    date: "19:00 · 12/12/2026",
    location: "SECC, Quận 7, TP. HCM",
    seatZone: "VIP Pit Standing — Số #142",
    seller: "hiphop_sol...771e",
    sellerNote: "Trùng ngày du lịch đã đặt, pass hòa vốn",
    originalPrice: "1.600.000đ",
    passPrice: "1.450.000đ",
    solPrice: "0.38 SOL",
    verified: true,
  },
  {
    id: 6,
    title: "Ultra Music Festival Vietnam — Electric Dance Horizon",
    category: "edm",
    artist: "Martin Garrix, Hardwell, KSHMR",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
    date: "15:00 · 24/12/2026",
    location: "Khu đô thị Sala, TP. Thủ Đức",
    seatZone: "VIP 2-Day Pass + NFC Band",
    seller: "rave_vietnam...33d1",
    sellerNote: "Nhóm bạn bớt người đi, nhường lại đúng giá",
    originalPrice: "3.200.000đ",
    passPrice: "2.850.000đ",
    solPrice: "0.76 SOL",
    verified: true,
  },
  {
    id: 7,
    title: "Chị Đẹp Đạp Gió Rẽ Sóng 2026 — The Grand Gala Night",
    category: "vpop",
    artist: "Dàn Nghệ Sĩ Chị Đẹp",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    date: "20:00 · 08/01/2027",
    location: "SECC, TP. HCM",
    seatZone: "Hạng Vàng A — Ghế VIP 09",
    seller: "minh_thu...610a",
    sellerNote: "Tết phải về quê sớm hơn dự kiến, nhượng lại",
    originalPrice: "2.500.000đ",
    passPrice: "2.200.000đ",
    solPrice: "0.58 SOL",
    verified: true,
  },
  {
    id: 8,
    title: "Monsoon Music Festival: Gió Mùa Âm Nhạc Di Sản",
    category: "indie",
    artist: "Quốc tế & Indie Việt",
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80",
    date: "17:00 · 18/01/2027",
    location: "Hoàng Thành Thăng Long, Hà Nội",
    seatZone: "Pass Trọn Gói 3 Ngày + Vòng NFC",
    seller: "hanoi_indie...884c",
    sellerNote: "Chỉ đi được ngày 1, pass cả combo 3 ngày giá ưu đãi",
    originalPrice: "1.450.000đ",
    passPrice: "1.300.000đ",
    solPrice: "0.34 SOL",
    verified: true,
  },
];

const CATEGORIES = [
  { id: "all", name: "Tất cả" },
  { id: "vpop", name: "V-Pop" },
  { id: "kpop", name: "K-Pop" },
  { id: "rap", name: "Rap / Hip-Hop" },
  { id: "indie", name: "Indie & Rock" },
  { id: "edm", name: "EDM / Festival" },
];

// ─────────────────────────────────────────────
// MARKETPLACE PAGE
// ─────────────────────────────────────────────
export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState<"all" | "under1m" | "1to3m" | "over3m">("all");
  const [seatFilter, setSeatFilter] = useState<"all" | "vip" | "fanzone" | "ga">("all");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listSuccess, setListSuccess] = useState(false);
  const [listForm, setListForm] = useState({
    title: "",
    artist: "",
    seatZone: "",
    originalPrice: "",
    passPrice: "",
    note: "",
    walletAddress: "",
  });

  // ── FILTERING ──────────────────────────────
  const filtered = TICKETS
    .filter((t) => {
      const matchCat = selectedCategory === "all" || t.category === selectedCategory;
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.toLowerCase().includes(searchQuery.toLowerCase());
      const priceNum = parseInt(t.passPrice.replace(/\D/g, ""), 10);
      const matchPrice =
        priceFilter === "all" ||
        (priceFilter === "under1m" && priceNum < 1_000_000) ||
        (priceFilter === "1to3m" && priceNum >= 1_000_000 && priceNum <= 3_000_000) ||
        (priceFilter === "over3m" && priceNum > 3_000_000);
      const zoneLower = t.seatZone.toLowerCase();
      const matchSeat =
        seatFilter === "all" ||
        (seatFilter === "vip" && (zoneLower.includes("vip") || zoneLower.includes("bạch kim"))) ||
        (seatFilter === "fanzone" && (zoneLower.includes("fanzone") || zoneLower.includes("pit"))) ||
        (seatFilter === "ga" && (zoneLower.includes("ga") || zoneLower.includes("standard") || zoneLower.includes("vàng")));
      const matchVerified = !onlyVerified || t.verified;
      return matchCat && matchSearch && matchPrice && matchSeat && matchVerified;
    })
    .sort((a, b) => {
      const pa = parseInt(a.passPrice.replace(/\D/g, ""), 10);
      const pb = parseInt(b.passPrice.replace(/\D/g, ""), 10);
      return sortOrder === "asc" ? pa - pb : pb - pa;
    });

  const activeFilterCount = [priceFilter !== "all", seatFilter !== "all", onlyVerified].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* ── PAGE HEADER ─────────────────────── */}
      <div className="mb-8 border-b border-zinc-800 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">Cộng đồng Solana Tickets</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Chợ trao đổi vé
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-zinc-400 leading-relaxed">
              Nơi những người <strong className="text-zinc-200">có vé nhưng không thể tham dự</strong> đăng nhượng lại cho người cần.
              Giao dịch được <strong className="text-zinc-200">bảo vệ tự động</strong> — tiền chỉ về người bán sau khi người mua vào cổng thành công.
            </p>

            {/* PROTECTED NOTICE */}
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="text-[11px] font-medium text-emerald-400">
                Tiền chỉ thanh toán cho người bán sau khi bạn vào cổng thành công
              </span>
            </div>
          </div>

          {/* LIST A TICKET CTA */}
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <button
              onClick={() => { setListSuccess(false); setIsListModalOpen(true); }}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#F97316] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#ea6d0e] cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Đăng vé cần pass
            </button>
            <span className="text-[10px] text-zinc-500">Bạn có vé nhưng không đi được?</span>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="mt-5 flex items-center gap-6 text-xs text-zinc-500">
          <span className="font-mono">
            <strong className="text-zinc-200">{TICKETS.length}</strong> vé đang cần pass
          </span>
          <span className="text-zinc-700">·</span>
          <span>
            <strong className="text-zinc-200">100%</strong> vé được xác minh tính hợp lệ
          </span>
          <span className="text-zinc-700">·</span>
          <Link to="/" className="text-zinc-400 hover:text-white transition-colors">
            ← Xem sự kiện mua vé chính thức
          </Link>
        </div>
      </div>

      {/* ── SEARCH & FILTERS ────────────────── */}
      <div className="mb-6 flex flex-col gap-3">
        {/* ROW 1 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Tìm theo sự kiện, nghệ sĩ hoặc địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 pl-9 pr-4 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-700 focus:bg-zinc-900 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="h-9 gap-2 rounded-lg border-zinc-800 bg-zinc-900/50 px-3.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />
              Giá: {sortOrder === "asc" ? "Thấp → Cao" : "Cao → Thấp"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`h-9 gap-2 rounded-lg px-3.5 text-xs font-medium transition-colors cursor-pointer ${
                isFilterOpen || activeFilterCount > 0
                  ? "border-zinc-600 bg-zinc-800 text-white"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Filter className="h-3.5 w-3.5 text-zinc-500" />
              Lọc
              {activeFilterCount > 0 && (
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded bg-[#F97316] font-mono text-[9px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* CATEGORY CHIPS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-zinc-100 text-black font-semibold"
                  : "border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ADVANCED FILTERS */}
        {isFilterOpen && (
          <div className="rounded-xl border border-zinc-800 bg-[#12131A] p-4">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">Khoảng giá pass</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "under1m", label: "< 1 Triệu" },
                    { id: "1to3m", label: "1 – 3 Triệu" },
                    { id: "over3m", label: "> 3 Triệu" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setPriceFilter(item.id as typeof priceFilter)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        priceFilter === item.id
                          ? "bg-zinc-100 text-black"
                          : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">Khu vực ghế</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "vip", label: "VIP / Bạch Kim" },
                    { id: "fanzone", label: "Fanzone / Pit" },
                    { id: "ga", label: "Standard / GA" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSeatFilter(item.id as typeof seatFilter)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        seatFilter === item.id
                          ? "bg-zinc-100 text-black"
                          : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-zinc-500">Xác thực on-chain</label>
                <button
                  onClick={() => setOnlyVerified(!onlyVerified)}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    onlyVerified
                      ? "border border-emerald-800/60 bg-emerald-950/60 text-emerald-400"
                      : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {onlyVerified ? "✓ Chỉ vé đã xác thực" : "Tất cả trạng thái"}
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3 text-xs">
              <span className="text-zinc-500">
                Tìm thấy <strong className="font-mono text-zinc-200">{filtered.length}</strong> vé cần pass
              </span>
              <button
                onClick={() => { setPriceFilter("all"); setSeatFilter("all"); setOnlyVerified(false); setSelectedCategory("all"); setSearchQuery(""); }}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Đặt lại
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── TICKET CARDS GRID ───────────────── */}
      {filtered.length === 0 ? (
        <div className="my-16 flex flex-col items-center rounded-xl border border-zinc-800 py-16 text-center">
          <TicketIcon className="h-9 w-9 text-zinc-700" />
          <h3 className="mt-4 text-sm font-semibold text-white">Không tìm thấy vé phù hợp</h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">Thử từ khóa khác hoặc đặt lại bộ lọc.</p>
          <button
            onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setPriceFilter("all"); setSeatFilter("all"); setOnlyVerified(false); }}
            className="mt-4 rounded-lg border border-zinc-800 px-4 py-2 text-xs text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((ticket) => {
            const orig = parseInt(ticket.originalPrice.replace(/\D/g, ""), 10);
            const pass = parseInt(ticket.passPrice.replace(/\D/g, ""), 10);
            const savings = orig - pass;
            const savingsPct = orig > 0 ? Math.round((savings / orig) * 100) : 0;
            return (
              <Card
                key={ticket.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#12131A] transition-colors hover:border-zinc-700 p-0"
              >
                {/* IMAGE */}
                <div className="relative aspect-[16/9] overflow-hidden bg-zinc-900">
                  <img
                    src={ticket.image}
                    alt={ticket.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,#12131A_5%,transparent_60%)]" />

                  <div className="absolute left-2.5 top-2.5 right-2.5 flex items-center justify-between">
                    <span className="rounded border border-zinc-700/60 bg-black/70 px-2 py-0.5 text-[10px] font-medium text-zinc-200 backdrop-blur-sm">
                      {ticket.artist}
                    </span>
                    {ticket.verified && (
                      <span className="flex items-center gap-1 rounded border border-emerald-800/60 bg-black/70 px-2 py-0.5 text-[10px] font-medium text-emerald-400 backdrop-blur-sm">
                        <ShieldCheck className="h-2.5 w-2.5" />
                        On-chain
                      </span>
                    )}
                  </div>
                </div>

                {/* BODY */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
                    {ticket.title}
                  </h3>

                  <div className="mt-2">
                    <span className="rounded border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                      {ticket.seatZone}
                    </span>
                  </div>

                  {/* SELLER NOTE */}
                  <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-zinc-500">
                    <MessageSquare className="h-3 w-3 shrink-0 text-zinc-600 mt-0.5" />
                    <span className="italic line-clamp-2">"{ticket.sellerNote}"</span>
                  </div>

                  <div className="mt-3 space-y-1.5 border-t border-zinc-800 pt-3 text-[11px] text-zinc-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                      {ticket.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                      <span className="truncate">{ticket.location}</span>
                    </div>
                  </div>

                  {/* PRICE FOOTER */}
                  <div className="mt-4 border-t border-zinc-800 pt-3">
                    {/* PRICE ROW */}
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <div className="text-[10px] text-zinc-500">Giá pass lại</div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-sm font-bold text-white">{ticket.passPrice}</span>
                          {savingsPct > 0 && (
                            <span className="rounded border border-emerald-900 bg-emerald-950/60 px-1 font-mono text-[9px] text-emerald-400">
                              -{savingsPct}%
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-500">≈ {ticket.solPrice}</div>
                        {savings > 0 && (
                          <div className="text-[9px] text-zinc-600 mt-0.5">
                            Tiết kiệm {savings.toLocaleString("vi-VN")}đ so giá BTC
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedTicket(ticket.id)}
                        className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#F97316] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#ea6d0e] cursor-pointer shrink-0"
                      >
                        Nhận vé này
                      </button>
                    </div>

                    {/* SELLER */}
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      <span className="font-mono">{ticket.seller}</span>
                      <span>· Escrow bảo chứng</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── DIALOGS ─────────────────────────── */}

      {/* CONFIRM RECEIVE TICKET */}
      <Dialog open={selectedTicket !== null} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-md border-zinc-800 bg-[#0E0F16] text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-white">
              <Lock className="h-4 w-4 text-[#F97316]" />
              Xác nhận nhận vé qua Escrow
            </DialogTitle>
          </DialogHeader>
          <Separator className="bg-zinc-800" />

          {/* ESCROW FLOW EXPLANATION */}
          <div className="space-y-3 text-xs">
            <p className="leading-relaxed text-zinc-400">
              Vé này do <strong className="text-white">thành viên cộng đồng</strong> đăng nhượng lại. Tiền bạn thanh toán sẽ được giữ an toàn — chỉ chuyển cho người nhượng vé sau khi bạn <strong className="text-white">vào cổng thành công</strong>.
            </p>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3.5 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-400">Thanh toán qua:</span>
                <span className="font-semibold text-white">Thẻ / Chuyển khoản / Ví điện tử</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Phí dịch vụ:</span>
                <span className="text-emerald-400">Miễn phí</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Bảo vệ bởi:</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  Hệ thống bảo vệ tự động
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Hoàn tiền nếu:</span>
                <span className="text-zinc-200">Sự kiện hủy / Vé không hợp lệ</span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5">
              <Info className="h-3.5 w-3.5 shrink-0 text-zinc-500 mt-0.5" />
              <span className="text-[11px] text-zinc-400 leading-relaxed">
                Đây là vé do người dùng khác nhượng lại, không phải vé bán từ nhà tổ chức. Vé đã được xác minh hợp lệ nên bạn hoàn toàn yên tâm.
              </span>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              variant="outline"
              onClick={() => setSelectedTicket(null)}
              className="flex-1 rounded-lg border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
            >
              Hủy
            </Button>
            <button
              onClick={() => {
                alert("Chức năng thanh toán đang được phát triển!");
                setSelectedTicket(null);
              }}
              className="flex-1 rounded-lg bg-[#F97316] hover:bg-[#ea6d0e] py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Xác nhận nhận vé
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* LIST TICKET MODAL */}
      <Dialog open={isListModalOpen} onOpenChange={(open) => { if (!open) { setIsListModalOpen(false); setListSuccess(false); } }}>
        <DialogContent className="max-w-lg border-zinc-800 bg-[#0E0F16] text-zinc-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-sm font-semibold text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded border border-zinc-700 bg-zinc-900">
                <Store className="h-3.5 w-3.5 text-[#F97316]" />
              </div>
              <div>
                Đăng vé cần pass lại
                <div className="text-[11px] font-normal text-zinc-400">Ký quỹ Escrow — người nhận chỉ trả tiền sau check-in</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <Separator className="bg-zinc-800" />

          {listSuccess ? (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-800/60 bg-emerald-950/60 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h5 className="text-sm font-semibold text-white">Đăng vé thành công!</h5>
              <p className="mt-1.5 max-w-sm text-xs text-zinc-400">
                Vé của bạn đã được đưa vào chợ cộng đồng và ký quỹ Escrow. Tiền sẽ về ví bạn ngay khi người nhận check-in thành công.
              </p>
              <button
                onClick={() => { setIsListModalOpen(false); setListSuccess(false); }}
                className="mt-5 rounded-lg bg-[#F97316] hover:bg-[#ea6d0e] px-6 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Hoàn tất
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); setListSuccess(true); }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-300">Tên sự kiện *</label>
                <Input
                  required
                  placeholder="VD: Anh Trai Say Hi 2026 — The Final Concert"
                  value={listForm.title}
                  onChange={(e) => setListForm({ ...listForm, title: e.target.value })}
                  className="h-8 rounded-lg border-zinc-800 bg-zinc-900/60 text-zinc-100 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-zinc-300">Nghệ sĩ *</label>
                  <Input
                    required
                    placeholder="VD: Dàn Cast Say Hi"
                    value={listForm.artist}
                    onChange={(e) => setListForm({ ...listForm, artist: e.target.value })}
                    className="h-8 rounded-lg border-zinc-800 bg-zinc-900/60 text-zinc-100 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-zinc-300">Khu vực ghế *</label>
                  <Input
                    required
                    placeholder="VD: Fanzone A1 — Hàng 2"
                    value={listForm.seatZone}
                    onChange={(e) => setListForm({ ...listForm, seatZone: e.target.value })}
                    className="h-8 rounded-lg border-zinc-800 bg-zinc-900/60 text-zinc-100 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-300">Giá gốc mua vé (VNĐ)</label>
                <Input
                  placeholder="VD: 2.200.000"
                  value={listForm.originalPrice}
                  onChange={(e) => setListForm({ ...listForm, originalPrice: e.target.value })}
                  className="h-8 rounded-lg border-zinc-800 bg-zinc-900/60 text-zinc-100 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-300">Giá muốn pass *</label>
                <Input
                  required
                  placeholder="VD: 1.950.000"
                  value={listForm.passPrice}
                  onChange={(e) => setListForm({ ...listForm, passPrice: e.target.value })}
                  className="h-8 rounded-lg border-zinc-800 bg-zinc-900/60 text-zinc-100 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-300">Lý do pass lại (hiển thị cho người nhận)</label>
              <Input
                placeholder="VD: Bận đột xuất, pass lại đúng giá..."
                value={listForm.note}
                onChange={(e) => setListForm({ ...listForm, note: e.target.value })}
                className="h-8 rounded-lg border-zinc-800 bg-zinc-900/60 text-zinc-100 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-300">Số tài khoản nhận tiền *</label>
              <Input
                required
                placeholder="Số tài khoản ngân hàng hoặc ví điện tử"
                value={listForm.walletAddress}
                onChange={(e) => setListForm({ ...listForm, walletAddress: e.target.value })}
                className="h-8 rounded-lg border-zinc-800 bg-zinc-900/60 text-zinc-100 text-xs"
              />
            </div>
            <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5 text-[11px] text-zinc-400">
              Miễn phí đăng tin. Tiền được chuyển về tài khoản sau khi người nhận vé vào cổng thành công. Hoàn tiền cho người mua nếu không ai nhận.
            </p>
              <div className="flex gap-2.5 border-t border-zinc-800 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsListModalOpen(false)}
                  className="flex-1 rounded-lg border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
                >
                  Hủy
                </Button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-[#F97316] hover:bg-[#ea6d0e] py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Đăng vé cần pass
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
