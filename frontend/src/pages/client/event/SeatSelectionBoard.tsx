import { useMemo, useState, useEffect } from "react";
import {
  Armchair,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  AlertCircle,
  Plus,
  Layers,
} from "lucide-react";

export interface ZoneTabInfo {
  id: string;
  name: string;
  color: string;
  price: number;
  qty: number;
  selectedSeatsCount: number;
}

interface SeatSelectionBoardProps {
  activeZoneId: string;
  zoneName: string;
  zoneColor?: string;
  zoneTickets: number;
  selectedSeats: string[];
  allZones: ZoneTabInfo[];
  onSwitchZone: (zoneId: string) => void;
  onSelectSeat: (seatId: string) => void;
  onClearSeats: () => void;
  onAutoPickSeats: () => void;
  onSwitchToOverview?: () => void;
  onAddTicketForZone?: () => void;
}

/**
 * Cấu hình sơ đồ và dãy ghế ngồi phù hợp riêng cho từng phân khu
 */
export function getZoneSeatConfig(zoneName: string) {
  const name = (zoneName || "").toUpperCase();

  if (name.includes("SVIP")) {
    return {
      rows: ["SA", "SB"],
      seatsPerRow: 8,
      occupied: new Set(["SA3", "SB4", "SB7"]),
      description: "Hàng ghế sofa/lounge bọc nệm sát sân khấu chính, tầm nhìn VIP",
      badge: "Ghế VIP Sát Sân Khấu",
    };
  }

  if (name.includes("VIP")) {
    return {
      rows: ["VA", "VB", "VC"],
      seatsPerRow: 10,
      occupied: new Set(["VA2", "VA5", "VB6", "VC3", "VC8"]),
      description: "Hàng ghế trung tâm đối diện sàn catwalk, góc nhìn bao quát",
      badge: "Ghế VIP Trung Tâm",
    };
  }

  if (name.includes("CAT 1") || name.includes("KHÁN ĐÀI 1") || name.includes("CAT1")) {
    return {
      rows: ["C1-A", "C1-B", "C1-C", "C1-D"],
      seatsPerRow: 10,
      occupied: new Set(["C1-A3", "C1-A4", "C1-B7", "C1-C2", "C1-D5"]),
      description: "Khán đài tầng 1 có mái che, âm thanh vòm nổi D-Line rõ nét",
      badge: "Khán Đài Tầng 1",
    };
  }

  if (name.includes("CAT 2") || name.includes("KHÁN ĐÀI 2") || name.includes("CAT2")) {
    return {
      rows: ["C2-A", "C2-B", "C2-C", "C2-D", "C2-E"],
      seatsPerRow: 10,
      occupied: new Set(["C2-A1", "C2-B5", "C2-C6", "C2-D8", "C2-E3"]),
      description: "Khán đài tầng 2 thoáng mát, hỗ trợ màn hình LED lớn trực tiếp",
      badge: "Khán Đài Tầng 2",
    };
  }

  if (name.includes("ĐỨNG") || name.includes("STANDING") || name.includes("FANZONE")) {
    return {
      rows: ["FZ-A", "FZ-B"],
      seatsPerRow: 10,
      occupied: new Set(["FZ-A2", "FZ-A6", "FZ-B4", "FZ-B8"]),
      description: "Khu vực đứng sát sàn catwalk cuồng nhiệt, nhận STT check-in",
      badge: "Vị Trí Đứng Gần Sân Khấu",
    };
  }

  // Khu vực mặc định / Khảo sát / Test
  return {
    rows: ["A", "B", "C", "D"],
    seatsPerRow: 10,
    occupied: new Set(["A3", "A4", "B6", "C2", "D5"]),
    description: "Ghế ngồi tiêu chuẩn chính hãng có mã số định danh",
    badge: "Khu Vực Tiêu Chuẩn",
  };
}

export default function SeatSelectionBoard({
  activeZoneId,
  zoneName,
  zoneColor = "#F97316",
  zoneTickets,
  selectedSeats,
  allZones,
  onSwitchZone,
  onSelectSeat,
  onClearSeats,
  onAutoPickSeats,
  onSwitchToOverview,
  onAddTicketForZone,
}: SeatSelectionBoardProps) {
  const config = useMemo(() => getZoneSeatConfig(zoneName), [zoneName]);
  const isFull = selectedSeats.length >= zoneTickets;
  const remaining = Math.max(0, zoneTickets - selectedSeats.length);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Tự tắt thông báo sau 4 giây
  useEffect(() => {
    if (!warningMessage) return;
    const timer = setTimeout(() => {
      setWarningMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [warningMessage]);

  // Xóa cảnh báo khi đổi khu vực
  useEffect(() => {
    setWarningMessage(null);
  }, [activeZoneId]);

  // Xử lý khi bấm vào 1 ghế
  const handleSeatClick = (seatId: string) => {
    if (zoneTickets === 0) {
      setWarningMessage(
        `Khu vực "${zoneName}" đang có 0 vé. Hãy bấm (+) để chọn vé trước khi chọn ghế!`,
      );
      return;
    }

    const isAlreadySelected = selectedSeats.includes(seatId);

    // Nếu ghế chưa chọn mà đã chọn đủ số lượng vé yêu cầu của khu vực này -> Báo số lượng ghế đã đạt đủ
    if (!isAlreadySelected && selectedSeats.length >= zoneTickets) {
      setWarningMessage(
        `⚠️ Bạn đã chọn đủ ${zoneTickets}/${zoneTickets} ghế cho khu vực "${zoneName}"! Hãy bỏ chọn bớt ghế cũ nếu muốn đổi sang ghế ${seatId}.`,
      );
      return;
    }

    setWarningMessage(null);
    onSelectSeat(seatId);
  };

  // Danh sách toàn bộ ghế trống trong khu vực này
  const availableSeats = useMemo(() => {
    const list: string[] = [];
    config.rows.forEach((row) => {
      for (let i = 1; i <= config.seatsPerRow; i++) {
        const seatId = `${row}${i}`;
        if (!config.occupied.has(seatId)) {
          list.push(seatId);
        }
      }
    });
    return list;
  }, [config]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#12131A] p-4 sm:p-5 space-y-4 shadow-xl">
      {/* ── THANH CHUYỂN ĐỔI KHU VỰC (ZONE TABS) ─────────────────────── */}
      {allZones.length > 1 && (
        <div className="space-y-1.5 border-b border-zinc-800 pb-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-[#F97316]" />
              Chọn sơ đồ theo khu vực:
            </span>
            {onSwitchToOverview && (
              <button
                type="button"
                onClick={onSwitchToOverview}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                Xem toàn cảnh
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {allZones.map((z) => {
              const isCurrent = z.id === activeZoneId;
              const hasTickets = z.qty > 0;
              const isCompleted = hasTickets && z.selectedSeatsCount === z.qty;

              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => onSwitchZone(z.id)}
                  className={`shrink-0 flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border cursor-pointer ${
                    isCurrent
                      ? "border-[#F97316] bg-[#F97316]/20 text-white shadow-[0_0_12px_rgba(249,115,22,0.2)]"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: z.color }}
                  />
                  <span>{z.name}</span>
                  {hasTickets && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {z.selectedSeatsCount}/{z.qty} ghế
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── HEADER CỦA PHÂN KHU ĐANG CHỌN ──────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: zoneColor }}
            />
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              Sơ đồ chỗ ngồi: {zoneName}
              <span className="rounded-md bg-zinc-800/90 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                {config.badge}
              </span>
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {zoneTickets === 0 ? (
              <span className="text-zinc-400">
                Chưa có vé cho khu vực này.{" "}
                <button
                  type="button"
                  onClick={onAddTicketForZone}
                  className="text-[#F97316] hover:underline font-bold inline-flex items-center gap-0.5 ml-1"
                >
                  <Plus className="h-3 w-3" />
                  Chọn 1 vé ngay
                </button>
              </span>
            ) : remaining > 0 ? (
              <span className="text-amber-400 font-medium">
                Vui lòng chọn thêm <strong>{remaining}</strong> ghế cho khu vực này
              </span>
            ) : (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                Đã chọn đủ {zoneTickets} ghế cho khu vực {zoneName}
              </span>
            )}
          </p>
        </div>

        {/* Nút thao tác tự chọn ghế */}
        {zoneTickets > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAutoPickSeats}
              disabled={availableSeats.length === 0}
              className="inline-flex items-center gap-1 rounded-lg bg-[#F97316]/20 border border-[#F97316]/50 px-2.5 py-1.5 text-xs font-bold text-[#F97316] hover:bg-[#F97316] hover:text-white transition-colors cursor-pointer"
              title="Tự động chọn các ghế gần nhau"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Tự chọn ghế
            </button>
          </div>
        )}
      </div>

      {/* ── THÔNG BÁO CẢNH BÁO KHI CHỌN ĐỦ SỐ LƯỢNG GHẾ ──────────────── */}
      {warningMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/50 bg-amber-500/15 p-3 text-xs text-amber-300 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 animate-pulse" />
          <span className="font-medium flex-1">{warningMessage}</span>
          <button
            type="button"
            onClick={() => setWarningMessage(null)}
            className="rounded p-0.5 text-amber-400 hover:text-white hover:bg-amber-500/20 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── SÂN KHẤU CHÍNH (STAGE) ─────────────────────────────────── */}
      <div className="mx-auto max-w-md text-center pt-1">
        <div className="relative overflow-hidden rounded-xl border border-orange-500/30 bg-gradient-to-b from-orange-500/15 via-zinc-900 to-zinc-950 py-2.5 px-4 shadow-[0_0_20px_rgba(249,115,22,0.15)]">
          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[#F97316] flex items-center justify-center gap-2">
            <span>▲</span>
            <span>HƯỚNG SÂN KHẤU CHÍNH (STAGE)</span>
            <span>▲</span>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
            {config.description}
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-32 bg-[#F97316]" />
        </div>
      </div>

      {/* ── BẢNG SƠ ĐỒ GHẾ NGỒI THEO ĐÚNG KHU VỰC ───────────────────── */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[340px] max-w-lg mx-auto bg-zinc-950/80 rounded-xl border border-zinc-800 p-3 sm:p-4 space-y-2.5">
          {config.rows.map((row) => {
            const half = Math.ceil(config.seatsPerRow / 2);
            const leftSeats = Array.from({ length: half }, (_, idx) => idx + 1);
            const rightSeats = Array.from(
              { length: config.seatsPerRow - half },
              (_, idx) => half + idx + 1,
            );

            return (
              <div
                key={row}
                className="flex items-center justify-center gap-1 sm:gap-2"
              >
                {/* Nhãn hàng ghế bên trái */}
                <span className="w-8 text-center text-xs font-black text-zinc-400 font-mono shrink-0">
                  {row}
                </span>

                {/* Khối ghế bên trái */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {leftSeats.map((num) => {
                    const seatId = `${row}${num}`;
                    const isOccupied = config.occupied.has(seatId);
                    const isSelected = selectedSeats.includes(seatId);

                    return (
                      <button
                        key={seatId}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => handleSeatClick(seatId)}
                        className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center cursor-pointer select-none ${
                          isSelected
                            ? "bg-[#F97316] text-white border border-white shadow-[0_0_12px_rgba(249,115,22,0.8)] scale-105 ring-2 ring-[#F97316]/50"
                            : isOccupied
                              ? "bg-zinc-900/60 text-zinc-600 border border-zinc-800/80 cursor-not-allowed line-through"
                              : "bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-[#F97316] hover:text-[#F97316] hover:bg-[#F97316]/10 active:scale-95"
                        }`}
                        title={
                          isOccupied
                            ? `Ghế ${seatId}: Đã có người đặt`
                            : isSelected
                              ? `Ghế ${seatId} (${zoneName}): Đang chọn`
                              : `Ghế ${seatId} (${zoneName}): Còn trống`
                        }
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {/* Lối đi ở giữa */}
                <div className="px-1.5 sm:px-2 flex flex-col items-center justify-center">
                  <span className="h-4 w-px bg-zinc-800" />
                </div>

                {/* Khối ghế bên phải */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {rightSeats.map((num) => {
                    const seatId = `${row}${num}`;
                    const isOccupied = config.occupied.has(seatId);
                    const isSelected = selectedSeats.includes(seatId);

                    return (
                      <button
                        key={seatId}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => handleSeatClick(seatId)}
                        className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center cursor-pointer select-none ${
                          isSelected
                            ? "bg-[#F97316] text-white border border-white shadow-[0_0_12px_rgba(249,115,22,0.8)] scale-105 ring-2 ring-[#F97316]/50"
                            : isOccupied
                              ? "bg-zinc-900/60 text-zinc-600 border border-zinc-800/80 cursor-not-allowed line-through"
                              : "bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-[#F97316] hover:text-[#F97316] hover:bg-[#F97316]/10 active:scale-95"
                        }`}
                        title={
                          isOccupied
                            ? `Ghế ${seatId}: Đã có người đặt`
                            : isSelected
                              ? `Ghế ${seatId} (${zoneName}): Đang chọn`
                              : `Ghế ${seatId} (${zoneName}): Còn trống`
                        }
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {/* Nhãn hàng ghế bên phải */}
                <span className="w-8 text-center text-xs font-black text-zinc-400 font-mono shrink-0">
                  {row}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CHÚ THÍCH TRẠNG THÁI GHẾ ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-1 border-t border-zinc-800/80">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded bg-zinc-900 border border-zinc-700" />
          <span className="text-zinc-300 text-[11px]">Còn trống</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded bg-[#F97316] border border-white shadow-sm" />
          <span className="text-white font-semibold text-[11px]">
            Đang chọn ({selectedSeats.length}/{zoneTickets})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded bg-zinc-900/60 border border-zinc-800/80 line-through text-zinc-600 text-[9px] flex items-center justify-center">
            ✕
          </div>
          <span className="text-zinc-500 text-[11px]">Đã bán</span>
        </div>
      </div>

      {/* ── THANH HIỂN THỊ CÁC GHẾ ĐÃ CHỌN CỦA KHU VỰC NÀY ────────────── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Armchair className="h-3.5 w-3.5 text-[#F97316]" />
            Ghế {zoneName}:
          </span>
          {selectedSeats.length === 0 ? (
            <span className="text-xs text-zinc-500 italic">
              Chưa chọn ghế nào trong khu vực này
            </span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedSeats.map((seatId) => (
                <span
                  key={seatId}
                  onClick={() => handleSeatClick(seatId)}
                  className="inline-flex items-center gap-1 rounded-md bg-[#F97316] px-2 py-0.5 text-xs font-bold text-white shadow-sm cursor-pointer hover:bg-red-500 transition-colors"
                  title="Bấm để xóa ghế này"
                >
                  {seatId}
                  <span className="text-[10px] opacity-75">✕</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {selectedSeats.length > 0 && (
          <button
            type="button"
            onClick={onClearSeats}
            className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Chọn lại khu vực này
          </button>
        )}
      </div>
    </div>
  );
}
