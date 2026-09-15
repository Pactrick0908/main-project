import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Ticket as TicketIcon,
  QrCode,
  Calendar,
  MapPin,
  ShieldCheck,
  Download,
  Store,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TicketPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "used" | "reselling">("upcoming");
  const [selectedQR, setSelectedQR] = useState<number | null>(null);

  const myTickets = [
    {
      id: 1,
      title: "Anh Trai Say Hi 2026 - The Final Concert Night 3",
      artist: "Dàn Cast Anh Trai Say Hi",
      date: "20:00 - 28/09/2026",
      location: "Sân vận động Mỹ Đình, Hà Nội",
      seatZone: "Fanzone A1 - Cận sân khấu",
      gate: "GATE 02 • LỐI VIP A",
      ticketId: "#ATS-0892-SOL",
      nftAddress: "4kF7...88e1",
      txHash: "5jKm...sol3",
      status: "upcoming",
      purchasePrice: "1.950.000đ (0.52 SOL)",
      image:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 2,
      title: "BLACKPINK World Tour [BORN PINK] En-core Live in Saigon",
      artist: "BLACKPINK",
      date: "19:30 - 15/10/2026",
      location: "Sân vận động Quân Khu 7, TP. HCM",
      seatZone: "VIP Soundcheck - Hàng 03 Ghế 18",
      gate: "GATE 01 • CỔNG CHÍNH",
      ticketId: "#BP-7712-SOL",
      nftAddress: "9pL2...33b9",
      txHash: "2xYq...sol9",
      status: "upcoming",
      purchasePrice: "6.200.000đ (1.65 SOL)",
      image:
        "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 3,
      title: "Những Thành Phố Mơ Màng Year-End Music Festival",
      artist: "Vũ, Chillies, Đen Vâu",
      date: "16:00 - 10/01/2026",
      location: "Công viên Yên Sở, Hà Nội",
      seatZone: "GA Standard - Vé tự do",
      gate: "GATE GA-B",
      ticketId: "#NTPMM-4412-SOL",
      nftAddress: "1aQ9...77cc",
      txHash: "8vNn...sol1",
      status: "used",
      purchasePrice: "690.000đ (0.18 SOL)",
      image:
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const filteredTickets = myTickets.filter((t) => t.status === activeTab);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* TOP HEADER WITH SOLANA WALLET STATUS */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span>Solana Tickets Wallet</span>
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-zinc-400">Non-Custodial</span>
          </div>
          <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Vé của tôi (My Tickets)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Quản lý mã QR check-in sự kiện, chứng chỉ NFT chính chủ và chuyển nhượng vé P2P.
          </p>
        </div>

        {/* WALLET CHIP */}
        <div className="flex items-center gap-3 self-start sm:self-auto rounded-lg border border-zinc-800 bg-[#0E1017] px-3.5 py-2">
          <div className="flex h-2 w-2 rounded-full bg-emerald-400"></div>
          <div>
            <div className="text-[9px] text-zinc-500 uppercase font-mono">Ví Solana Mainnet</div>
            <div className="text-xs font-semibold text-zinc-200 font-mono">8xG7...91eF</div>
          </div>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-[#0E1017] p-4">
          <div className="text-xs text-zinc-400">Tổng vé đang sở hữu</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">2</span>
            <span className="text-xs text-emerald-400 font-medium">Vé hợp lệ</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#0E1017] p-4">
          <div className="text-xs text-zinc-400">Sự kiện gần nhất</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-semibold text-white truncate">Anh Trai Say Hi</span>
            <span className="text-xs text-zinc-500 font-mono whitespace-nowrap">28/09</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#0E1017] p-4">
          <div className="text-xs text-zinc-400">Ước tính giá trị vé</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">2.17 SOL</span>
            <span className="text-xs text-zinc-500">≈ 8.150.000 ₫</span>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="mb-6 flex items-center gap-2 border-b border-zinc-800/80 pb-3">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "upcoming"
              ? "bg-zinc-100 text-black font-semibold"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <TicketIcon className="h-3.5 w-3.5" />
          <span>Sắp diễn ra ({myTickets.filter((t) => t.status === "upcoming").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("used")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "used"
              ? "bg-zinc-100 text-black font-semibold"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Đã tham gia ({myTickets.filter((t) => t.status === "used").length})</span>
        </button>

        <Link
          to="/marketplace"
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
        >
          <Store className="h-3.5 w-3.5 text-zinc-400" />
          <span>Khám phá thêm vé</span>
        </Link>
      </div>

      {/* TICKET LIST */}
      {filteredTickets.length === 0 ? (
        <div className="my-12 flex flex-col items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
          <TicketIcon className="h-12 w-12 text-neutral-600 mb-3" />
          <h3 className="text-base font-bold text-white">Chưa có vé trong mục này</h3>
          <p className="mt-1 text-xs text-neutral-400 max-w-sm">
            Bạn có thể tìm kiếm và mua vé concert chính chủ tại Chợ vé P2P với bảo chứng Solana Escrow.
          </p>
          <Link to="/marketplace" className="mt-4">
            <Button className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-xs font-black text-neutral-950 px-5">
              Đến Chợ Vé Ngay
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="relative overflow-hidden rounded-xl border border-zinc-800 bg-[#0E1017] p-5 shadow-sm transition-all hover:border-zinc-700"
            >
              {/* TOP HEADER OF TICKET */}
              <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-black/80 border border-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                      {ticket.artist}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      NFT Verified
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-bold text-white leading-snug">
                    {ticket.title}
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedQR(ticket.id)}
                  className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-zinc-700 bg-white p-1.5 shadow-sm transition-transform hover:scale-105 cursor-pointer"
                  title="Bấm để phóng to mã QR check-in"
                >
                  <QrCode className="h-8 w-8 text-black" />
                  <span className="text-[7px] font-black text-black uppercase mt-0.5">QR Entry</span>
                </button>
              </div>

              {/* SEAT & LOCATION DETAILS */}
              <div className="my-3.5 grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-2.5">
                  <span className="block text-[9px] uppercase font-mono text-zinc-500">Chỗ ngồi</span>
                  <span className="font-semibold text-zinc-200 mt-0.5 block">{ticket.seatZone}</span>
                </div>

                <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-2.5">
                  <span className="block text-[9px] uppercase font-mono text-zinc-500">Cổng vào</span>
                  <span className="font-semibold text-white mt-0.5 block">{ticket.gate}</span>
                </div>
              </div>

              {/* DATE & VENUE */}
              <div className="space-y-1 text-xs text-zinc-400 border-t border-zinc-800/80 pt-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  <span>{ticket.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{ticket.location}</span>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-3">
                <div className="font-mono text-[10px] text-zinc-500">
                  <span>Mã vé: </span>
                  <strong className="text-zinc-300">{ticket.ticketId}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedQR(ticket.id)}
                    className="h-8 gap-1.5 rounded-lg border-zinc-800 bg-zinc-900/60 text-xs text-zinc-300 hover:border-zinc-700 hover:text-white cursor-pointer"
                  >
                    <QrCode className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Mã QR</span>
                  </Button>

                  <Link to="/marketplace">
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-xs font-semibold text-black transition-colors cursor-pointer"
                    >
                      <Store className="h-3.5 w-3.5 text-black" />
                      <span>Rao bán P2P</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* FULLSCREEN QR CODE MODAL FOR CHECK-IN */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-sm rounded-xl border border-zinc-800 bg-[#0E1017] p-6 text-center shadow-2xl">
            <button
              onClick={() => setSelectedQR(null)}
              className="absolute right-4 top-4 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
            >
              ✕
            </button>

            <div className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>MÃ CHECK-IN HỢP LỆ</span>
            </div>

            <h4 className="text-base font-bold text-white">
              Xuất trình mã tại cổng soát vé
            </h4>
            <p className="mt-1 text-xs text-zinc-400">
              Mã QR động tự động làm mới mỗi 60 giây để chống sao chép và chụp màn hình bán lại.
            </p>

            {/* QR CONTAINER */}
            <div className="my-6 mx-auto flex h-52 w-52 items-center justify-center rounded-xl border border-zinc-700 bg-white p-3 shadow-md">
              <QrCode className="h-full w-full text-black" />
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-left space-y-1 font-mono text-[10px] text-zinc-400">
              <div className="flex justify-between">
                <span>NFT Token:</span>
                <span className="text-zinc-200">#ATS-0892-SOL</span>
              </div>
              <div className="flex justify-between">
                <span>Cổng Check-in:</span>
                <span className="text-white font-sans font-semibold">GATE 02 • VIP A</span>
              </div>
            </div>

            <Button
              onClick={() => {
                alert("Mã QR đã được lưu về thư viện ảnh để check-in Offline!");
                setSelectedQR(null);
              }}
              className="mt-5 w-full rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-xs font-semibold text-black cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-black" />
              Lưu mã QR Offline
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
