import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  Users,
  ArrowRight,
  Mic2,
} from "lucide-react";
import {
  EVENTS_DATA,
  type DetailedEvent,
  type EventArtist,
} from "@/data/events.data";
import { listingToTicket, marketplaceApi } from "@/api/marketplace.api";
import type { MarketplaceTicket } from "@/pages/client/market/marketplace.data";
import { useAuth } from "@/context/AuthContext";
import { ticketApi } from "@/api/ticket.api";
import { eventApi } from "@/api/event.api";
import VietQRModal from "./VietQRModal";
import SeatSelectionBoard, {
  getZoneSeatConfig,
  type ZoneTabInfo,
} from "./SeatSelectionBoard";
import StadiumOverviewMap from "./StadiumOverviewMap";
import ZoneTicketSelector from "./ZoneTicketSelector";
import { toast } from "@/lib/toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Modal } from "@/components/ui/modal";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const eventId = id ? parseInt(id, 10) : 1;
  const initialEvent = EVENTS_DATA[eventId] || EVENTS_DATA[1];
  const [event, setEvent] = useState<DetailedEvent>(initialEvent);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);

  // Số lượng vé cho từng zone: { [zoneId]: quantity }
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<string, number>
  >(() => {
    const initial: Record<string, number> = {};
    initialEvent.zones.forEach((z) => {
      initial[z.id] = 0;
    });
    return initial;
  });

  const [activeZoneId, setActiveZoneId] = useState<string>(
    initialEvent.zones[0]?.id || "default",
  );
  const [isZoomed, setIsZoomed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [salesLocked, setSalesLocked] = useState(false);
  const [salesLockedReason, setSalesLockedReason] = useState("");

  // Quản lý ghế ngồi đã chọn theo từng phân khu (vd: { svip: ["SA1", "SA2"], cat1: ["C1-A1"] })
  const [selectedSeatsByZone, setSelectedSeatsByZone] = useState<
    Record<string, string[]>
  >({});
  const [showOverviewMap, setShowOverviewMap] = useState(false);

  // Tải dữ liệu sự kiện từ backend DB
  useEffect(() => {
    let isMounted = true;
    setIsLoadingEvent(true);

    eventApi
      .getEventById(eventId)
      .then((res) => {
        if (isMounted && res.data?.event) {
          const dbEvent = res.data.event as any;
          const st = String(dbEvent.status || "").toLowerCase();
          if (st === "draft" || st === "ended" || st === "completed") {
            toast.error(
              st === "ended" || st === "completed"
                ? "Sự kiện đã ngừng bán hoặc kết thúc."
                : "Sự kiện này chưa mở bán.",
            );
            navigate("/");
            return;
          }
          const soldOut = Boolean(dbEvent.soldOut);
          setSalesLocked(soldOut);
          setSalesLockedReason(
            soldOut ? "Tất cả hạng vé đã bán hết." : "",
          );
          const fallback = EVENTS_DATA[eventId] || EVENTS_DATA[1];

          // Ghép dữ liệu DB với fallback UI (banner, artist…)
          const normalized: DetailedEvent = {
            ...fallback,
            ...dbEvent,
            id: dbEvent.id,
            title: dbEvent.title || fallback.title,
            description: dbEvent.description || fallback.description,
            bannerImage:
              dbEvent.bannerImage ||
              dbEvent.bannerUrl ||
              fallback.bannerImage,
            venue: dbEvent.venue || dbEvent.place?.name || fallback.venue,
            address:
              dbEvent.address || dbEvent.place?.address || fallback.address,
            city: dbEvent.city || dbEvent.place?.city || fallback.city,
            organizer:
              dbEvent.organizer ||
              dbEvent.organizerName ||
              fallback.organizer,
            logoUrl: dbEvent.logoUrl || undefined,
            mapUrl: dbEvent.mapUrl || undefined,
            artist:
              dbEvent.artist ||
              (Array.isArray(dbEvent.artists) && dbEvent.artists.length
                ? dbEvent.artists
                    .map(
                      (a: EventArtist) =>
                        a.stageName?.trim() || a.name,
                    )
                    .join(", ")
                : fallback.artist),
            artists: Array.isArray(dbEvent.artists)
              ? dbEvent.artists.map((a: any) => ({
                  id: Number(a.id),
                  name: a.name,
                  stageName: a.stageName ?? null,
                  avatarUrl: a.avatarUrl ?? null,
                  genre: a.genre ?? null,
                  role: a.role ?? "performer",
                }))
              : fallback.artists,
            zones: (dbEvent.zones || []).map((z: any, idx: number) => ({
              id: String(z.eventZoneId ?? z.id),
              name: z.name,
              price: Number(z.price) || 0,
              solPrice: z.solPrice || Number(z.price) / 5_000_000 || 0,
              available: z.available ?? z.totalSeats ?? 0,
              totalSeats: z.totalSeats ?? z.available ?? 0,
              rowCount: z.rowCount ?? z.row ?? undefined,
              soldSeats: Array.isArray(z.soldSeats) ? z.soldSeats : [],
              eventZoneId: Number(z.eventZoneId ?? z.id),
              zoneId: z.zoneId,
              hasSeats: z.hasSeats,
              color:
                z.color ||
                fallback.zones[idx % fallback.zones.length]?.color ||
                "#F97316",
              benefits: z.benefits ||
                fallback.zones[idx % fallback.zones.length]?.benefits || [
                  "Check-in QR",
                ],
            })),
          };

          setEvent(normalized);
          if (normalized.zones.length > 0) {
            const initial: Record<string, number> = {};
            normalized.zones.forEach((z) => {
              initial[z.id] = 0;
            });
            setSelectedQuantities(initial);
            setActiveZoneId(normalized.zones[0].id);
            setSelectedSeatsByZone({});
          }
        }
      })
      .catch((err) => {
        console.warn(
          "[EventDetailPage] Fallback sang mock data:",
          err?.message,
        );
        if (isMounted) {
          const fallback = EVENTS_DATA[eventId] || EVENTS_DATA[1];
          setEvent(fallback);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingEvent(false);
      });

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // Cuộn lên đầu trang khi mở trang chi tiết vé
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [eventId]);

  const [resaleTickets, setResaleTickets] = useState<MarketplaceTicket[]>([]);

  useEffect(() => {
    let cancelled = false;
    marketplaceApi
      .listListings({ eventId })
      .then((res) => {
        if (!cancelled) {
          setResaleTickets((res.data.listings ?? []).map(listingToTicket));
        }
      })
      .catch(() => {
        if (!cancelled) setResaleTickets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // Modals state
  const [qrModal, setQrModal] = useState(false);
  const pollCleanupRef = useRef<(() => void) | null>(null);
  const fulfillInFlightRef = useRef<Set<string>>(new Set());
  const finishedOrderRef = useRef<Set<string>>(new Set());
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{
    orderId: number;
    orderCode: number;
    totalAmount: number;
    checkoutUrl: string;
    qrCode: string;
  } | null>(null);

  const formatVND = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  // Tăng giảm số lượng vé cho từng hạng vé
  const handleQuantityChange = (zoneId: string, delta: number) => {
    setActiveZoneId(zoneId);
    // Khi tăng vé > 0, tự động chuyển sang Bảng chọn ghế ngồi
    setShowOverviewMap(false);

    setSelectedQuantities((prev) => {
      const current = prev[zoneId] || 0;
      const next = Math.max(0, Math.min(4, current + delta));
      return { ...prev, [zoneId]: next };
    });
  };

  // Tính tổng số lượng vé và tổng tiền
  const totalTickets = Object.values(selectedQuantities).reduce(
    (a, b) => a + b,
    0,
  );
  const totalPriceVND = event.zones.reduce((sum, zone) => {
    const qty = selectedQuantities[zone.id] || 0;
    return sum + zone.price * qty;
  }, 0);

  const activeZone =
    event.zones.find((z) => z.id === activeZoneId) || event.zones[0];
  const activeZoneTickets = selectedQuantities[activeZone.id] || 0;
  const activeZoneSeats = selectedSeatsByZone[activeZone.id] || [];

  // Toàn bộ danh sách ghế đã chọn của mọi khu vực
  const allSelectedSeats = useMemo(() => {
    const list: string[] = [];
    event.zones.forEach((z) => {
      const seats = selectedSeatsByZone[z.id] || [];
      list.push(...seats);
    });
    return list;
  }, [event.zones, selectedSeatsByZone]);

  // Thông tin các zone để hiển thị tab và trạng thái
  const allZonesTabInfo: ZoneTabInfo[] = useMemo(() => {
    return event.zones.map((z: any) => ({
      id: z.id,
      name: z.name,
      color: z.color,
      price: z.price,
      qty: selectedQuantities[z.id] || 0,
      selectedSeatsCount: (selectedSeatsByZone[z.id] || []).length,
      totalSeats: z.totalSeats || z.available || undefined,
      rowCount: z.rowCount || undefined,
      soldSeats: z.soldSeats || [],
    }));
  }, [event.zones, selectedQuantities, selectedSeatsByZone]);

  // Tự động đồng bộ số ghế theo từng phân khu khi số lượng vé thay đổi
  useEffect(() => {
    setSelectedSeatsByZone((prev) => {
      let changed = false;
      const next = { ...prev };

      event.zones.forEach((z: any) => {
        const qty = selectedQuantities[z.id] || 0;
        const currentSeats = next[z.id] || [];

        if (qty === 0) {
          if (currentSeats.length > 0) {
            next[z.id] = [];
            changed = true;
          }
          return;
        }

        // Nếu đã chọn nhiều hơn số lượng vé, cắt bớt
        if (currentSeats.length > qty) {
          next[z.id] = currentSeats.slice(0, qty);
          changed = true;
          return;
        }

        // Nếu chưa đủ số lượng vé, gợi ý thêm ghế trống của phân khu đó
        if (currentSeats.length < qty) {
          const cfg = getZoneSeatConfig(
            z.name,
            z.totalSeats || z.available,
            z.rowCount,
            z.soldSeats,
          );
          const available: string[] = [];
          cfg.rows.forEach((row, rowIdx) => {
            const count = cfg.seatsInRow[rowIdx] ?? cfg.seatsPerRow;
            for (let i = 1; i <= count; i++) {
              const id = `${row}${i}`;
              if (!cfg.occupied.has(id) && !currentSeats.includes(id)) {
                available.push(id);
              }
            }
          });

          const needed = qty - currentSeats.length;
          const additional = available.slice(0, needed);
          next[z.id] = [...currentSeats, ...additional];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [selectedQuantities, event.zones]);

  // Click chọn / bỏ chọn ghế trong 1 khu vực cụ thể
  const handleSelectSeatForZone = (zoneId: string, seatId: string) => {
    const qty = selectedQuantities[zoneId] || 0;
    setSelectedSeatsByZone((prev) => {
      const current = prev[zoneId] || [];
      if (current.includes(seatId)) {
        return { ...prev, [zoneId]: current.filter((s) => s !== seatId) };
      }
      if (current.length >= qty) {
        return prev;
      }
      return { ...prev, [zoneId]: [...current, seatId] };
    });
  };

  const handleClearSeatsForZone = (zoneId: string) => {
    setSelectedSeatsByZone((prev) => ({ ...prev, [zoneId]: [] }));
  };

  const handleAutoPickSeatsForZone = (zoneId: string) => {
    const targetZone = event.zones.find((z) => z.id === zoneId) as any;
    if (!targetZone) return;
    const qty = selectedQuantities[zoneId] || 0;
    const cfg = getZoneSeatConfig(
      targetZone.name,
      targetZone.totalSeats || targetZone.available,
      targetZone.rowCount,
      targetZone.soldSeats,
    );
    const available: string[] = [];
    cfg.rows.forEach((row, rowIdx) => {
      const count = cfg.seatsInRow[rowIdx] ?? cfg.seatsPerRow;
      for (let i = 1; i <= count; i++) {
        const id = `${row}${i}`;
        if (!cfg.occupied.has(id)) {
          available.push(id);
        }
      }
    });
    setSelectedSeatsByZone((prev) => ({
      ...prev,
      [zoneId]: available.slice(0, qty),
    }));
  };

  // Xử lý tạo đơn hàng VietQR
  const handleBuyTicket = async () => {
    if (totalTickets === 0) {
      toast.error("Vui lòng chọn ít nhất 1 vé để tiếp tục!");
      return;
    }

    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }

    const eventIdNum = Number(event.id);
    if (!Number.isInteger(eventIdNum) || eventIdNum < 1) {
      toast.error(
        "Sự kiện này chưa có trên hệ thống. Hãy chọn sự kiện từ trang chủ.",
      );
      return;
    }

    // Build items với ghế (auto-pick sync nếu thiếu)
    const itemsFinal = event.zones
      .map((z) => {
        const quantity = selectedQuantities[z.id] || 0;
        if (quantity < 1) return null;
        const eventZoneId = Number((z as any).eventZoneId ?? z.id);
        let seatLabels = [...(selectedSeatsByZone[z.id] || [])];
        if (seatLabels.length < quantity) {
          const cfg = getZoneSeatConfig(
            z.name,
            (z as any).totalSeats || z.available,
            (z as any).rowCount,
            (z as any).soldSeats,
          );
          const available: string[] = [];
          cfg.rows.forEach((row, rowIdx) => {
            const count = cfg.seatsInRow[rowIdx] ?? cfg.seatsPerRow;
            for (let i = 1; i <= count; i++) {
              const id = `${row}${i}`;
              if (!cfg.occupied.has(id) && !seatLabels.includes(id)) {
                available.push(id);
              }
            }
          });
          seatLabels = [...seatLabels, ...available].slice(0, quantity);
          setSelectedSeatsByZone((prev) => ({
            ...prev,
            [z.id]: seatLabels,
          }));
        }
        return {
          eventZoneId,
          quantity,
          seatLabels: seatLabels.slice(0, quantity),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);

    if (!itemsFinal.length) {
      toast.error("Vui lòng chọn ít nhất 1 vé!");
      return;
    }
    if (salesLocked) {
      toast.error(salesLockedReason || "Không thể mua vé lúc này");
      return;
    }

    setIsProcessing(true);
    try {
      stopPolling();
      const previousCode = orderInfo?.orderCode;
      if (previousCode) {
        try {
          await ticketApi.cancelPendingOrder(previousCode);
        } catch {
          /* ignore */
        }
      }

      const res = await ticketApi.createOrderVietQR({
        eventId: eventIdNum,
        items: itemsFinal,
        userId: user?.id ? Number(user.id) : undefined,
      });

      if (res?.data) {
        setOrderInfo(res.data);
        setQrModal(true);
        try {
          localStorage.setItem(
            "pendingPayOSOrderCode",
            String(res.data.orderCode),
          );
        } catch {
          /* ignore */
        }
        startPolling(res.data.orderCode);
      }
    } catch (err: any) {
      toast.error(
        err instanceof Error ? err.message : "Không tạo được đơn thanh toán",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const stopPolling = () => {
    pollCleanupRef.current?.();
    pollCleanupRef.current = null;
  };

  const abandonCurrentOrder = async () => {
    stopPolling();
    const code = orderInfo?.orderCode;
    setQrModal(false);
    if (!code) return;
    try {
      const pending = localStorage.getItem("pendingPayOSOrderCode");
      if (pending === String(code)) {
        localStorage.removeItem("pendingPayOSOrderCode");
      }
    } catch {
      /* ignore */
    }
    try {
      await ticketApi.cancelPendingOrder(code);
    } catch {
      /* đơn đã PAID / không tìm thấy — bỏ qua */
    }
  };

  const fulfillAfterPayOSPaid = async (orderCode: number) => {
    const key = String(orderCode);
    if (fulfillInFlightRef.current.has(key)) {
      for (let i = 0; i < 10; i++) {
        const res = await ticketApi.getOrderStatus(orderCode);
        if (res.data?.status === "PAID" && (res.data.ticketIds?.length ?? 0) > 0) {
          return res.data;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
      return null;
    }
    fulfillInFlightRef.current.add(key);
    try {
      const existing = await ticketApi.getOrderStatus(orderCode);
      if (
        existing.data?.status === "PAID" &&
        (existing.data.ticketIds?.length ?? 0) > 0
      ) {
        return existing.data;
      }
      if (existing.data?.status === "CANCELLED") {
        return null;
      }
      await ticketApi.completePayOSOrder(orderCode);
      for (let i = 0; i < 10; i++) {
        const res = await ticketApi.getOrderStatus(orderCode);
        if (res.data?.status === "PAID") return res.data;
        await new Promise((r) => setTimeout(r, 400));
      }
      return null;
    } finally {
      fulfillInFlightRef.current.delete(key);
    }
  };

  const finishPaidOrder = (orderCode: number) => {
    const key = String(orderCode);
    if (finishedOrderRef.current.has(key)) return;
    finishedOrderRef.current.add(key);
    stopPolling();
    try {
      localStorage.removeItem("pendingPayOSOrderCode");
    } catch {
      /* ignore */
    }
    setQrModal(false);
    navigate(`/my-tickets?orderCode=${orderCode}&status=PAID`);
  };

  // Poll PayOS; chỉ gọi webhook khi PayOS báo đã nhận tiền
  const startPolling = (orderCode: number) => {
    stopPolling();
    let stopped = false;
    let inFlight = false;
    const poll = async () => {
      if (stopped || inFlight) return stopped;
      inFlight = true;
      try {
        const payos = await ticketApi.getPayOSPaymentStatus(orderCode);
        if (payos.data?.orderStatus === "CANCELLED") {
          stopped = true;
          return true;
        }
        if (payos.data?.paid) {
          const paid = await fulfillAfterPayOSPaid(orderCode);
          if (paid) {
            stopped = true;
            finishPaidOrder(orderCode);
            return true;
          }
        }
      } catch {
        // PayOS chưa PAID hoặc lỗi mạng — thử lại
      } finally {
        inFlight = false;
      }
      return false;
    };

    void poll();
    const interval = setInterval(async () => {
      const done = await poll();
      if (done) clearInterval(interval);
    }, 3000);

    const timeout = setTimeout(() => {
      stopped = true;
      clearInterval(interval);
    }, 300000);

    pollCleanupRef.current = () => {
      stopped = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  };

  const handleSimulatePayment = async () => {
    if (!orderInfo) return;
    stopPolling();
    try {
      await fulfillAfterPayOSPaid(orderInfo.orderCode);
      finishPaidOrder(orderInfo.orderCode);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Giả lập thanh toán thất bại — kiểm tra backend",
      );
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  if (isLoadingEvent) {
    return (
      <LoadingSpinner
        label="Đang tải sự kiện…"
        size="lg"
        className="min-h-[70vh]"
      />
    );
  }

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
                Chợ vé P2P: Đang có {resaleTickets.length} người pass lại vé
                concert này!
              </div>
              <div className="text-zinc-400 text-xs mt-0.5">
                Giá chỉ từ{" "}
                <span className="font-extrabold text-emerald-400">
                  {resaleTickets[0]?.passPrice}
                </span>{" "}
                · Bảo chứng 100% qua hệ thống ký quỹ trung gian
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

      {/* ── NGHỆ SĨ THAM GIA ─────────────────────────────────────────── */}
      {(event.artists?.length ?? 0) > 0 && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="rounded-2xl border border-zinc-800 bg-[#12131A] p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Mic2 className="h-4 w-4 text-[#F97316]" />
              <h2 className="text-sm font-bold text-white">
                Nghệ sĩ tham gia
              </h2>
              <span className="text-[11px] text-zinc-500">
                {event.artists!.length} nghệ sĩ
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {event.artists!.map((a) => {
                const displayName = a.stageName?.trim() || a.name;
                return (
                  <div
                    key={a.id}
                    className="flex w-[112px] shrink-0 flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-2.5 py-3 text-center"
                  >
                    {a.avatarUrl ? (
                      <img
                        src={a.avatarUrl}
                        alt={displayName}
                        className="size-14 rounded-full object-cover border border-zinc-700"
                      />
                    ) : (
                      <div
                        className="size-14 rounded-full bg-zinc-500/80 border border-zinc-700"
                        aria-hidden
                      />
                    )}
                    <div className="min-w-0 w-full">
                      <p className="truncate text-xs font-semibold text-white">
                        {displayName}
                      </p>
                      {a.stageName?.trim() && a.stageName !== a.name && (
                        <p className="truncate text-[10px] text-zinc-500">
                          {a.name}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── BỐ CỤC CHÍNH 50 / 50 ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* CỘT TRÁI (6 CỘT):
            - KHI TĂNG SỐ LƯỢNG VÉ > 0: HIỆN BẢNG CHỌN CHỖ NGỒI (A1, A2...)
            - KHI SỐ LƯỢNG = 0 HOẶC XEM TOÀN CẢNH: HIỆN ẢNH SƠ ĐỒ KHÁN ĐÀI */}
        <div className="lg:col-span-8 space-y-4">
          {totalTickets > 0 && !showOverviewMap ? (
            <SeatSelectionBoard
              activeZoneId={activeZone.id}
              zoneName={activeZone.name}
              zoneColor={activeZone.color}
              zoneTickets={activeZoneTickets}
              selectedSeats={activeZoneSeats}
              allZones={allZonesTabInfo}
              totalSeats={
                (activeZone as any).totalSeats ||
                (activeZone as any).available ||
                undefined
              }
              rowCount={(activeZone as any).rowCount || undefined}
              occupiedSeats={(activeZone as any).soldSeats || []}
              onSwitchZone={(newZoneId) => {
                setActiveZoneId(newZoneId);
                setShowOverviewMap(false);
              }}
              onSelectSeat={(seatId) =>
                handleSelectSeatForZone(activeZone.id, seatId)
              }
              onClearSeats={() => handleClearSeatsForZone(activeZone.id)}
              onAutoPickSeats={() => handleAutoPickSeatsForZone(activeZone.id)}
              onSwitchToOverview={() => setShowOverviewMap(true)}
              onAddTicketForZone={() => handleQuantityChange(activeZone.id, 1)}
            />
          ) : (
            <StadiumOverviewMap
              event={event}
              totalTickets={totalTickets}
              allSelectedSeats={allSelectedSeats}
              isZoomed={isZoomed}
              onToggleZoom={() => setIsZoomed(!isZoomed)}
              onOpenSeatBoard={() => setShowOverviewMap(false)}
            />
          )}
        </div>

        {/* CỘT PHẢI (6 CỘT): DANH SÁCH VÉ + SỐ LƯỢNG + THANH TOÁN */}
        <div className="lg:col-span-4">
          <ZoneTicketSelector
            event={event}
            selectedQuantities={selectedQuantities}
            selectedSeatsByZone={selectedSeatsByZone}
            activeZoneId={activeZoneId}
            totalTickets={totalTickets}
            totalPriceVND={totalPriceVND}
            allSelectedSeats={allSelectedSeats}
            isProcessing={isProcessing}
            salesLocked={salesLocked}
            salesLockedReason={salesLockedReason}
            formatVND={formatVND}
            onQuantityChange={handleQuantityChange}
            onSelectZone={(zoneId) => setActiveZoneId(zoneId)}
            onBuyTicket={handleBuyTicket}
          />
        </div>
      </div>

      {/* MODAL QUÉT MÃ VIETQR (PAYOS) */}
      <VietQRModal
        isOpen={qrModal}
        orderInfo={orderInfo}
        onClose={() => {
          void abandonCurrentOrder();
        }}
        onSimulateSuccess={handleSimulatePayment}
        formatVND={formatVND}
      />

      <Modal
        open={loginPromptOpen}
        onOpenChange={setLoginPromptOpen}
        title="Cần đăng nhập"
        description="Bạn cần đăng nhập để lưu vé vào tài khoản và nhận mã Dynamic QR check-in."
        confirmLabel="Đăng nhập"
        cancelLabel="Để sau"
        onConfirm={() => {
          setLoginPromptOpen(false);
          navigate("/login");
        }}
      />
    </div>
  );
}
