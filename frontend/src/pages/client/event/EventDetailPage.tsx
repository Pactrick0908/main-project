import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  ShieldCheck,
  Zap,
  CheckCircle2,
  QrCode,
  Check,
  Sparkles,
  Maximize2,
  Users,
  ArrowRight,
} from "lucide-react";
import { EVENTS_DATA } from "@/data/events.data";
import { getResaleTicketsByEventId } from "@/pages/client/market/marketplace.data";
import { useAuth } from "@/context/AuthContext";
import { ticketApi } from "@/api/ticket.api";
import VietQRModal from "./VietQRModal";
import PurchaseSuccessModal from "./PurchaseSuccessModal";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const eventId = id ? parseInt(id, 10) : 1;
  const event = EVENTS_DATA[eventId] || EVENTS_DATA[1];

  // Lưu số lượng vé cho từng zone: { [zoneId]: quantity }
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    event.zones.forEach((z, idx) => {
      // Mặc định chọn 1 vé cho hạng đầu tiên
      initial[z.id] = idx === 0 ? 1 : 0;
    });
    return initial;
  });

  const [activeZoneId, setActiveZoneId] = useState<string>(event.zones[0].id);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cuộn lên đầu trang khi mở trang chi tiết vé
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [eventId]);

  // Danh sách vé pass lại từ cộng đồng
  const resaleTickets = useMemo(() => {
    return getResaleTicketsByEventId(eventId);
  }, [eventId]);

  // Modals state
  const [qrModal, setQrModal] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{
    orderId: number;
    orderCode: number;
    totalAmount: number;
    checkoutUrl: string;
    qrCode: string;
  } | null>(null);

  const [successModal, setSuccessModal] = useState(false);
  const [createdTicketInfo, setCreatedTicketInfo] = useState<{
    zone: string;
    qty: number;
    total: number;
  } | null>(null);

  const formatVND = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  // Tăng giảm số lượng vé cho từng hạng vé
  const handleQuantityChange = (zoneId: string, delta: number) => {
    setActiveZoneId(zoneId);
    setSelectedQuantities((prev) => {
      const current = prev[zoneId] || 0;
      const next = Math.max(0, Math.min(4, current + delta));
      return { ...prev, [zoneId]: next };
    });
  };

  // Tính tổng số lượng vé và tổng tiền
  const totalTickets = Object.values(selectedQuantities).reduce((a, b) => a + b, 0);
  const totalPriceVND = event.zones.reduce((sum, zone) => {
    const qty = selectedQuantities[zone.id] || 0;
    return sum + zone.price * qty;
  }, 0);

  // Xử lý tạo đơn hàng VietQR
  const handleBuyTicket = async () => {
    if (totalTickets === 0) {
      alert("Vui lòng chọn ít nhất 1 vé để tiếp tục!");
      return;
    }

    if (!isAuthenticated) {
      if (
        confirm(
          "Bạn cần đăng nhập để lưu vé vào tài khoản và nhận mã Dynamic QR. Chuyển đến trang Đăng nhập ngay?"
        )
      ) {
        navigate("/login");
      }
      return;
    }

    const activeZone = event.zones.find((z) => z.id === activeZoneId) || event.zones[0];

    setIsProcessing(true);
    try {
      const res = await ticketApi.createOrderVietQR({
        quantity: totalTickets,
        unitPrice: totalPriceVND / totalTickets,
        userId: user?.id ? Number(user.id) : undefined,
      });

      if (res?.data) {
        setOrderInfo(res.data);
        setQrModal(true);
        startPolling(res.data.orderCode);
      }
    } catch (err: any) {
      console.warn("Lỗi gọi PayOS, fallback cấp vé trực tiếp:", err);
      await ticketApi.issueDemo().catch(() => {});
      setCreatedTicketInfo({
        zone: activeZone.name,
        qty: totalTickets,
        total: totalPriceVND,
      });
      setSuccessModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Polling trạng thái thanh toán từ PayOS
  const startPolling = (orderCode: number) => {
    const interval = setInterval(async () => {
      try {
        const res = await ticketApi.getOrderStatus(orderCode);
        if (res.data?.status === "PAID") {
          clearInterval(interval);
          setQrModal(false);
          const activeZone = event.zones.find((z) => z.id === activeZoneId) || event.zones[0];
          await ticketApi.issueDemo().catch(() => {});
          setCreatedTicketInfo({
            zone: activeZone.name,
            qty: totalTickets,
            total: totalPriceVND,
          });
          setSuccessModal(true);
        }
      } catch (e) {
        // Tiếp tục poll
      }
    }, 3000);

    setTimeout(() => clearInterval(interval), 300000);
  };

  const handleSimulatePayment = async () => {
    if (orderInfo) {
      try {
        await fetch("http://localhost:5000/api/v1/webhook/payos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "00",
            data: { orderCode: orderInfo.orderCode, code: "00" },
          }),
        });
      } catch (e) {}
    }
    setQrModal(false);
    const activeZone = event.zones.find((z) => z.id === activeZoneId) || event.zones[0];
    await ticketApi.issueDemo().catch(() => {});
    setCreatedTicketInfo({
      zone: activeZone.name,
      qty: totalTickets,
      total: totalPriceVND,
    });
    setSuccessModal(true);
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-zinc-100 py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Navigation */}
      <div className="max-w-7xl mx-auto mb-5 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách sự kiện
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Vé Chính Hãng
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            QR 60s
          </span>
        </div>
      </div>

      {/* Community Resale Notice Banner */}
      {resaleTickets.length > 0 && (
        <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/15 via-[#12131A] to-[#12131A] p-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F97316]/20 text-[#F97316]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">
                Chợ vé P2P: Đang có {resaleTickets.length} người pass lại vé concert này!
              </div>
              <div className="text-zinc-400 text-xs mt-0.5">
                Giá chỉ từ <span className="font-extrabold text-emerald-400">{resaleTickets[0].passPrice}</span> · Bảo chứng 100% qua hệ thống ký quỹ trung gian
              </div>
            </div>
          </div>
          <Link
            to={`/events/${eventId}/resale`}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#F97316] hover:bg-[#ea6d0e] px-4 py-2 font-bold text-white transition-colors text-xs shadow-md shadow-orange-500/20"
          >
            <span>Xem danh sách người pass vé</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ── BỐ CỤC CHÍNH 50 / 50 ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* ══════════════════════════════════════════════════════════════
            CỘT TRÁI (CHIẾM ~50% MÀN HÌNH - 6 CỘT): Ô CHỨA ẢNH SƠ ĐỒ KHÁN ĐÀI
            ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-[#12131A] p-4 sm:p-5">
            {/* Header thông tin ngắn */}
            <div className="mb-3">
              <span className="rounded bg-[#F97316]/20 text-[#F97316] text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                {event.category}
              </span>
              <h1 className="mt-1.5 text-lg sm:text-xl font-extrabold text-white leading-snug line-clamp-2">
                {event.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#F97316]" />
                  {event.date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  {event.venue}
                </span>
              </div>
            </div>

            {/* Ô CHỨA ẢNH SƠ ĐỒ KHÁN ĐÀI */}
            <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-black/60 group">
              <img
                src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80"
                alt="Sơ đồ khán đài"
                className={`w-full h-[380px] sm:h-[460px] object-cover object-center transition-all duration-300 ${
                  isZoomed ? "scale-125 cursor-zoom-out" : "cursor-zoom-in group-hover:scale-105"
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
              />
              {/* Overlay Sân khấu chỉ dẫn */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="rounded-lg bg-black/75 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-white border border-white/10 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#F97316]" />
                  SƠ ĐỒ KHÁN ĐÀI CHÍNH THỨC
                </span>
                <span className="rounded-lg bg-black/75 backdrop-blur-md px-2.5 py-1.5 text-[10px] text-zinc-300 border border-white/10 flex items-center gap-1 pointer-events-auto cursor-pointer"
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  <Maximize2 className="h-3 w-3" />
                  {isZoomed ? "Thu nhỏ" : "Phóng to"}
                </span>
              </div>

              {/* Chú thích Stage ở đáy ảnh */}
              <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/80 backdrop-blur-md p-2.5 border border-white/10 text-center">
                <div className="text-[11px] font-black tracking-widest text-[#F97316] uppercase">
                  ▲ HƯỚNG SÂN KHẤU CHÍNH (STAGE) ▲
                </div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 mt-2 text-center">
              Nhấp vào ảnh để phóng to/thu nhỏ vị trí các phân khu SVIP, VIP, CAT 1 &amp; CAT 2
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            CỘT PHẢI (CHIẾM ~50% MÀN HÌNH - 6 CỘT): DANH SÁCH VÉ + SỐ LƯỢNG + THANH TOÁN
            ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-zinc-800 bg-[#12131A] p-5 sm:p-6 space-y-6">
          
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Chọn loại vé &amp; Số lượng
              </h2>
              <span className="text-xs text-zinc-400">
                Đã chọn: <strong className="text-white">{totalTickets} vé</strong>
              </span>
            </div>

            {/* DANH SÁCH CÁC LOẠI VÉ TRONG ZONE KÈM Ô CHỌN SỐ LƯỢNG KẾ BÊN */}
            <div className="space-y-3.5">
              {event.zones.map((zone) => {
                const qty = selectedQuantities[zone.id] || 0;
                const isSelected = qty > 0;

                return (
                  <div
                    key={zone.id}
                    onClick={() => setActiveZoneId(zone.id)}
                    className={`flex items-center justify-between gap-3.5 rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? "border-[#F97316] bg-[#F97316]/10 shadow-[0_0_15px_rgba(249,115,22,0.15)] ring-1 ring-[#F97316]"
                        : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                    }`}
                  >
                    {/* Bên trái của Hàng vé: Tên, Màu sắc & Giá */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className="h-10 w-1.5 rounded-full shrink-0 mt-0.5"
                        style={{ backgroundColor: zone.color }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white truncate">
                            {zone.name}
                          </h3>
                        </div>
                        <div className="text-sm font-extrabold text-[#F97316] mt-0.5">
                          {formatVND(zone.price)}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5 line-clamp-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span>{zone.benefits[0] || "Bao gồm quyền vào cửa và check-in QR"}</span>
                        </div>
                      </div>
                    </div>

                    {/* KẾ BÊN: CHỖ ĐỂ LẤY SỐ LƯỢNG VÉ (+ / -) */}
                    <div className="flex items-center gap-2 shrink-0 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(zone.id, -1);
                        }}
                        disabled={qty <= 0}
                        className="h-7 w-7 rounded-lg border border-zinc-700 bg-zinc-800 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white font-mono">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(zone.id, 1);
                        }}
                        disabled={qty >= 4}
                        className="h-7 w-7 rounded-lg border border-zinc-700 bg-zinc-800 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              DƯỚI CÙNG: PHƯƠNG THỨC THANH TOÁN + TỔNG TIỀN + NÚT MUA VÉ
              ══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            {/* Phương thức thanh toán VietQR */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Chuyển khoản VietQR / MoMo (Napas247)
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Quét mã QR tự động xác nhận trong 3 giây
                  </div>
                </div>
              </div>
            </div>

            {/* Khung tổng tiền & Nút thanh toán */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-zinc-950 p-4 border border-zinc-800">
              <div>
                <div className="text-xs text-zinc-400">
                  Tổng tiền ({totalTickets} vé):
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#F97316]">
                  {formatVND(totalPriceVND)}
                </div>
              </div>

              <button
                type="button"
                onClick={handleBuyTicket}
                disabled={isProcessing || totalTickets === 0}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#ea6d0e] px-7 py-3.5 text-sm font-bold text-white transition-all shadow-[0_4px_20px_rgba(249,115,22,0.3)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang tạo đơn VietQR…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Thanh toán ngay
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── MODAL QUÉT MÃ VIETQR (PAYOS) ────────────────────────────────── */}
      <VietQRModal
        isOpen={qrModal}
        orderInfo={orderInfo}
        onClose={() => setQrModal(false)}
        onSimulateSuccess={handleSimulatePayment}
        formatVND={formatVND}
      />

      {/* ── MODAL THÔNG BÁO MUA VÉ THÀNH CÔNG ────────────────────────────── */}
      <PurchaseSuccessModal
        isOpen={successModal}
        eventTitle={event.title}
        ticketInfo={createdTicketInfo}
        onClose={() => setSuccessModal(false)}
        formatVND={formatVND}
      />
    </div>
  );
}
