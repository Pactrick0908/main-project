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
  totalSeats?: number;
  rowCount?: number;
  soldSeats?: string[];
}

interface SeatSelectionBoardProps {
  activeZoneId: string;
  zoneName: string;
  zoneColor?: string;
  zoneTickets: number;
  selectedSeats: string[];
  allZones: ZoneTabInfo[];
  totalSeats?: number;
  rowCount?: number;
  /** Ghế đã có ticket — ẩn khỏi sơ đồ */
  occupiedSeats?: string[];
  onSwitchZone: (zoneId: string) => void;
  onSelectSeat: (seatId: string) => void;
  onClearSeats: () => void;
  onAutoPickSeats: () => void;
  onSwitchToOverview?: () => void;
  onAddTicketForZone?: () => void;
}

export interface ZoneSeatLayout {
  rows: string[];
  /** Số ghế tối đa mỗi hàng (hàng cuối có thể ít hơn) */
  seatsPerRow: number;
  /** Số ghế thực tế từng hàng — khớp totalSeats từ DB */
  seatsInRow: number[];
  leftCount: number;
  rightCount: number;
  occupied: Set<string>;
  description: string;
  badge: string;
  totalComputedSeats: number;
}

/** 0 → A, 25 → Z, 26 → AA… */
function rowLabelAt(index: number, prefix = ""): string {
  let n = index;
  let label = "";
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);

  if (!prefix) return label;
  // Prefixed ngắn (S/V) ghép sát: SA, VB — prefix dài dùng dấu gạch: C1-A
  return prefix.length <= 1 ? `${prefix}${label}` : `${prefix}-${label}`;
}

function getZoneMeta(zoneName: string): {
  prefix: string;
  description: string;
  badge: string;
  defaultSeats: number;
  defaultRows?: number;
} {
  const name = (zoneName || "").toUpperCase();

  if (name.includes("SVIP")) {
    return {
      prefix: "S",
      description: "Hàng ghế sofa/lounge sát sân khấu chính",
      badge: "Ghế VIP Sát Sân Khấu",
      defaultSeats: 45,
      defaultRows: 5,
    };
  }
  if (name.includes("VIP")) {
    return {
      prefix: "V",
      description: "Hàng ghế trung tâm đối diện sàn catwalk",
      badge: "Ghế VIP Trung Tâm",
      defaultSeats: 120,
      defaultRows: 10,
    };
  }
  if (name.includes("CAT 1") || name.includes("KHÁN ĐÀI 1") || name.includes("CAT1")) {
    return {
      prefix: "C1",
      description: "Khán đài tầng 1 có mái che",
      badge: "Khán Đài Tầng 1",
      defaultSeats: 230,
      defaultRows: 15,
    };
  }
  if (name.includes("CAT 2") || name.includes("KHÁN ĐÀI 2") || name.includes("CAT2")) {
    return {
      prefix: "C2",
      description: "Khán đài tầng 2, hỗ trợ màn hình LED",
      badge: "Khán Đài Tầng 2",
      defaultSeats: 410,
      defaultRows: 20,
    };
  }
  if (name.includes("ĐỨNG") || name.includes("STANDING") || name.includes("FANZONE")) {
    return {
      prefix: "FZ",
      description: "Khu vực đứng sát sàn catwalk",
      badge: "Vị Trí Đứng Gần Sân Khấu",
      defaultSeats: 80,
      defaultRows: 8,
    };
  }

  return {
    prefix: "",
    description: "Ghế ngồi tiêu chuẩn có mã định danh",
    badge: "Khu Vực Tiêu Chuẩn",
    defaultSeats: 40,
    defaultRows: 4,
  };
}

/**
 * Chia ghế theo totalSeats / row:
 * - 200/10 → 10 hàng × 20 ghế (A1…J20)
 * - 200/11 → 11 hàng × 18 + 1 hàng × 2 (A…L)
 * Hàng đầu luôn là A, ghế bắt đầu từ 1.
 * occupiedSeats: mã ghế đã có ticket (vd ["A1","B3"]) → ẩn/khóa.
 */
export function getZoneSeatConfig(
  zoneName: string,
  zoneTotalSeats?: number,
  zoneRowCount?: number,
  occupiedSeats?: string[] | Set<string>,
): ZoneSeatLayout {
  const meta = getZoneMeta(zoneName);

  const targetSeats = Math.max(
    1,
    Math.floor(
      zoneTotalSeats && zoneTotalSeats > 0
        ? zoneTotalSeats
        : meta.defaultSeats,
    ),
  );

  let requestedRows: number;
  if (zoneRowCount && zoneRowCount > 0) {
    requestedRows = Math.floor(zoneRowCount);
  } else if (meta.defaultRows && !(zoneTotalSeats && zoneTotalSeats > 0)) {
    requestedRows = meta.defaultRows;
  } else {
    const idealPerRow = Math.min(
      20,
      Math.max(6, Math.round(Math.sqrt(targetSeats * 1.35))),
    );
    requestedRows = Math.max(1, Math.ceil(targetSeats / idealPerRow));
  }

  requestedRows = Math.max(1, Math.min(requestedRows, targetSeats));

  let seatsInRow: number[];
  if (requestedRows >= targetSeats) {
    seatsInRow = Array.from({ length: targetSeats }, () => 1);
  } else {
    const base = Math.floor(targetSeats / requestedRows);
    const rem = targetSeats % requestedRows;
    if (rem === 0) {
      seatsInRow = Array.from({ length: requestedRows }, () => base);
    } else {
      seatsInRow = [
        ...Array.from({ length: requestedRows }, () => base),
        rem,
      ];
    }
  }

  const numRows = seatsInRow.length;
  const seatsPerRow = Math.max(...seatsInRow, 1);
  // Luôn A, B, C… — không dùng prefix zone
  const rows = Array.from({ length: numRows }, (_, i) => rowLabelAt(i, ""));

  let leftCount = Math.ceil(seatsPerRow / 2);
  let rightCount = seatsPerRow - leftCount;
  if (seatsPerRow >= 12) {
    leftCount = Math.round(seatsPerRow * 0.6);
    rightCount = seatsPerRow - leftCount;
  } else if (seatsPerRow >= 8) {
    leftCount = Math.round(seatsPerRow * 0.55);
    rightCount = seatsPerRow - leftCount;
  }

  const occupied = new Set<string>();
  const sold =
    occupiedSeats instanceof Set
      ? occupiedSeats
      : new Set((occupiedSeats ?? []).map((s) => String(s).toUpperCase()));
  sold.forEach((label) => occupied.add(label.toUpperCase()));

  return {
    rows,
    seatsPerRow,
    seatsInRow,
    leftCount,
    rightCount,
    occupied,
    description: meta.description,
    badge: meta.badge,
    totalComputedSeats: targetSeats,
  };
}

export default function SeatSelectionBoard({
  activeZoneId,
  zoneName,
  zoneColor = "#F97316",
  zoneTickets,
  selectedSeats,
  allZones,
  totalSeats,
  rowCount,
  occupiedSeats,
  onSwitchZone,
  onSelectSeat,
  onClearSeats,
  onAutoPickSeats,
  onSwitchToOverview,
  onAddTicketForZone,
}: SeatSelectionBoardProps) {
  const currentZoneTab = allZones.find((z) => z.id === activeZoneId);
  const effectiveTotalSeats =
    totalSeats || currentZoneTab?.totalSeats || undefined;
  const effectiveRowCount = rowCount || currentZoneTab?.rowCount || undefined;
  const effectiveOccupied =
    occupiedSeats ?? currentZoneTab?.soldSeats ?? [];
  const occupiedKey = effectiveOccupied.join(",");

  const config = useMemo(
    () =>
      getZoneSeatConfig(
        zoneName,
        effectiveTotalSeats,
        effectiveRowCount,
        effectiveOccupied,
      ),
    // occupiedKey ổn định hơn reference array
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zoneName, effectiveTotalSeats, effectiveRowCount, occupiedKey],
  );

  const remaining = Math.max(0, zoneTickets - selectedSeats.length);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!warningMessage) return;
    const timer = setTimeout(() => setWarningMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [warningMessage]);

  useEffect(() => {
    setWarningMessage(null);
  }, [activeZoneId]);

  const handleSeatClick = (seatId: string) => {
    if (zoneTickets === 0) {
      setWarningMessage(
        `Khu vực "${zoneName}" đang có 0 vé. Hãy bấm (+) để chọn vé trước khi chọn ghế!`,
      );
      return;
    }

    const isAlreadySelected = selectedSeats.includes(seatId);

    if (!isAlreadySelected && selectedSeats.length >= zoneTickets) {
      setWarningMessage(
        `⚠️ Bạn đã chọn đủ ${zoneTickets}/${zoneTickets} ghế cho khu vực "${zoneName}"! Hãy bỏ bớt ghế cũ để đổi sang ${seatId}.`,
      );
      return;
    }

    setWarningMessage(null);
    onSelectSeat(seatId);
  };

  const availableSeats = useMemo(() => {
    const list: string[] = [];
    config.rows.forEach((row, rowIdx) => {
      const count = config.seatsInRow[rowIdx] ?? config.seatsPerRow;
      for (let i = 1; i <= count; i++) {
        const seatId = `${row}${i}`;
        if (!config.occupied.has(seatId)) list.push(seatId);
      }
    });
    return list;
  }, [config]);

  const seatSizeClass =
    config.seatsPerRow <= 8
      ? "h-8 w-8 text-[11px]"
      : config.seatsPerRow <= 12
        ? "h-7 w-7 text-[10px]"
        : config.seatsPerRow <= 16
          ? "h-6 w-6 text-[9px]"
          : "h-5 w-5 text-[8px]";

  return (
    <div className="flex flex-col h-full rounded-2xl border border-zinc-800 bg-[#12131A] p-3 sm:p-4 space-y-3 shadow-xl">
      {/* ── 1. THANH CHUYỂN ĐỔI KHU VỰC (ZONE TABS) ─────────────────────── */}
      {allZones.length > 1 && (
        <div className="space-y-1 border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 font-medium">
              <Layers className="h-3 w-3 text-[#F97316]" />
              Khu vực sơ đồ ghế:
            </span>
            {onSwitchToOverview && (
              <button
                type="button"
                onClick={onSwitchToOverview}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Eye className="h-3 w-3" />
                Sơ đồ khán đài
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {allZones.map((z) => {
              const isCurrent = z.id === activeZoneId;
              const hasTickets = z.qty > 0;
              const isCompleted = hasTickets && z.selectedSeatsCount === z.qty;

              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => onSwitchZone(z.id)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all border cursor-pointer ${
                    isCurrent
                      ? "border-[#F97316] bg-[#F97316]/20 text-white shadow-sm"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: z.color }}
                  />
                  <span>{z.name}</span>
                  {hasTickets && (
                    <span
                      className={`rounded px-1 text-[9px] font-mono font-bold ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {z.selectedSeatsCount}/{z.qty}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2. HEADER KHU VỰC & THÔNG TIN GHẾ ──────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: zoneColor }}
            />
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
              {zoneName}
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                {config.badge}
              </span>
            </h2>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {zoneTickets === 0 ? (
              <span>
                0 vé.{" "}
                <button
                  type="button"
                  onClick={onAddTicketForZone}
                  className="text-[#F97316] hover:underline font-bold inline-flex items-center gap-0.5"
                >
                  <Plus className="h-3 w-3" />
                  Thêm 1 vé
                </button>
              </span>
            ) : remaining > 0 ? (
              <span className="text-amber-400 font-medium">
                Cần chọn thêm <strong>{remaining}</strong> ghế
              </span>
            ) : (
              <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                <Check className="h-3 w-3" />
                Đã chọn đủ {zoneTickets} ghế
              </span>
            )}
          </p>
        </div>

        {zoneTickets > 0 && (
          <button
            type="button"
            onClick={onAutoPickSeats}
            disabled={availableSeats.length === 0}
            className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#F97316]/20 border border-[#F97316]/50 px-2.5 py-1 text-[11px] font-bold text-[#F97316] hover:bg-[#F97316] hover:text-white transition-colors cursor-pointer"
            title="Tự động chọn các ghế liền kề"
          >
            <Sparkles className="h-3 w-3" />
            Tự chọn
          </button>
        )}
      </div>

      {/* ── 3. THÔNG BÁO CẢNH BÁO ───────────────────────────────────────── */}
      {warningMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/15 p-2 text-[11px] text-amber-300 animate-in fade-in duration-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span className="font-medium flex-1 line-clamp-2">
            {warningMessage}
          </span>
          <button
            type="button"
            onClick={() => setWarningMessage(null)}
            className="rounded p-0.5 text-amber-400 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 4. SÂN KHẤU ─────────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-sm text-center">
        <div className="relative overflow-hidden rounded-lg border border-orange-500/30 bg-gradient-to-b from-orange-500/20 via-zinc-900 to-zinc-950 py-1.5 px-3">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F97316] flex items-center justify-center gap-1.5">
            <span>▲</span>
            <span>HƯỚNG SÂN KHẤU CHÍNH (STAGE)</span>
            <span>▲</span>
          </div>
          <div className="text-[9px] text-zinc-400 font-mono">
            {config.description} · {config.totalComputedSeats} ghế ·{" "}
            {config.rows.length} hàng
            {config.seatsInRow.length > 1 &&
            config.seatsInRow.some((n) => n !== config.seatsInRow[0])
              ? ` (${config.seatsInRow[0]} ghế/hàng + hàng cuối ${config.seatsInRow[config.seatsInRow.length - 1]} ghế)`
              : ` × ${config.seatsPerRow} ghế/hàng`}
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-24 bg-[#F97316]" />
        </div>
      </div>

      {/* ── 5. SƠ ĐỒ GHẾ ĐỘNG ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto rounded-xl border border-zinc-800/80 bg-zinc-950/90 p-3 sm:p-4 max-h-[460px] min-h-[260px] flex flex-col items-center justify-start">
        <div className="inline-flex flex-col gap-2 min-w-max my-auto">
          {config.rows.map((row, rowIdx) => {
            const rowSeatCount =
              config.seatsInRow[rowIdx] ?? config.seatsPerRow;
            const leftSeats = Array.from(
              { length: Math.min(config.leftCount, rowSeatCount) },
              (_, idx) => idx + 1,
            );
            const rightStart = config.leftCount + 1;
            const rightSeats = Array.from(
              {
                length: Math.max(0, rowSeatCount - config.leftCount),
              },
              (_, idx) => rightStart + idx,
            );

            return (
              <div
                key={row}
                className="flex items-center justify-center gap-1.5"
              >
                <span className="w-7 text-center text-[10px] font-black text-zinc-400 font-mono shrink-0">
                  {row}
                </span>

                <div className="flex items-center gap-1 sm:gap-1.5">
                  {leftSeats.map((num) => {
                    const seatId = `${row}${num}`;
                    // Ghế đã có ticket.seatId → ẩn khỏi sơ đồ
                    if (config.occupied.has(seatId)) {
                      return (
                        <span
                          key={seatId}
                          className={`${seatSizeClass} invisible pointer-events-none`}
                          aria-hidden
                        />
                      );
                    }
                    const isSelected = selectedSeats.includes(seatId);

                    return (
                      <button
                        key={seatId}
                        type="button"
                        onClick={() => handleSeatClick(seatId)}
                        className={`${seatSizeClass} rounded-md font-bold transition-all flex items-center justify-center cursor-pointer select-none ${
                          isSelected
                            ? "bg-[#F97316] text-white border border-white shadow-md scale-105 ring-1 ring-[#F97316]"
                            : "bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-[#F97316] hover:text-[#F97316] hover:bg-[#F97316]/10 active:scale-95"
                        }`}
                        title={
                          isSelected
                            ? `Ghế ${seatId} (${zoneName}): Đang chọn`
                            : `Ghế ${seatId} (${zoneName}): Còn trống`
                        }
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {rightSeats.length > 0 && (
                  <>
                    <div className="px-1.5 sm:px-2 flex flex-col items-center justify-center">
                      <span className="h-4 w-px bg-zinc-800" />
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {rightSeats.map((num) => {
                        const seatId = `${row}${num}`;
                        if (config.occupied.has(seatId)) {
                          return (
                            <span
                              key={seatId}
                              className={`${seatSizeClass} invisible pointer-events-none`}
                              aria-hidden
                            />
                          );
                        }
                        const isSelected = selectedSeats.includes(seatId);

                        return (
                          <button
                            key={seatId}
                            type="button"
                            onClick={() => handleSeatClick(seatId)}
                            className={`${seatSizeClass} rounded-md font-bold transition-all flex items-center justify-center cursor-pointer select-none ${
                              isSelected
                                ? "bg-[#F97316] text-white border border-white shadow-md scale-105 ring-1 ring-[#F97316]"
                                : "bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-[#F97316] hover:text-[#F97316] hover:bg-[#F97316]/10 active:scale-95"
                            }`}
                            title={
                              isSelected
                                ? `Ghế ${seatId} (${zoneName}): Đang chọn`
                                : `Ghế ${seatId} (${zoneName}): Còn trống`
                            }
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                <span className="w-7 text-center text-[10px] font-black text-zinc-400 font-mono shrink-0">
                  {row}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 6. CHÚ THÍCH ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 text-[11px] pt-1 border-t border-zinc-800/80">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-zinc-900 border border-zinc-700" />
          <span className="text-zinc-400">Trống</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-[#F97316] border border-white" />
          <span className="text-white font-medium">
            Đang chọn ({selectedSeats.length}/{zoneTickets})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border border-dashed border-zinc-700 opacity-40" />
          <span className="text-zinc-500">Đã bán (ẩn)</span>
        </div>
      </div>

      {/* ── 7. FOOTER GHẾ ĐÃ CHỌN ───────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-2.5 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
            <Armchair className="h-3 w-3 text-[#F97316]" />
            Đã chọn:
          </span>
          {selectedSeats.length === 0 ? (
            <span className="text-[11px] text-zinc-500 italic">
              Chưa chọn ghế nào
            </span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedSeats.map((seatId) => (
                <span
                  key={seatId}
                  onClick={() => handleSeatClick(seatId)}
                  className="inline-flex items-center gap-1 rounded bg-[#F97316] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm cursor-pointer hover:bg-red-500 transition-colors"
                  title="Bấm để bỏ ghế này"
                >
                  {seatId}
                  <span className="text-[8px] opacity-80">✕</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {selectedSeats.length > 0 && (
          <button
            type="button"
            onClick={onClearSeats}
            className="text-[10px] text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            Chọn lại
          </button>
        )}
      </div>
    </div>
  );
}
