import { CheckCircle2, Armchair, QrCode, Check, Sparkles } from "lucide-react";
import type { DetailedEvent } from "@/data/events.data";

interface ZoneTicketSelectorProps {
  event: DetailedEvent;
  selectedQuantities: Record<string, number>;
  selectedSeatsByZone: Record<string, string[]>;
  activeZoneId: string;
  totalTickets: number;
  totalPriceVND: number;
  allSelectedSeats: string[];
  isProcessing: boolean;
  formatVND: (val: number) => string;
  onQuantityChange: (zoneId: string, delta: number) => void;
  onSelectZone: (zoneId: string) => void;
  onBuyTicket: () => void;
}

export default function ZoneTicketSelector({
  event,
  selectedQuantities,
  selectedSeatsByZone,
  activeZoneId,
  totalTickets,
  totalPriceVND,
  allSelectedSeats,
  isProcessing,
  formatVND,
  onQuantityChange,
  onSelectZone,
  onBuyTicket,
}: ZoneTicketSelectorProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-[#12131A] p-3.5 sm:p-4 space-y-4">
      <div>
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 mb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            Chọn loại vé &amp; Số lượng
          </h2>
          <span className="text-[11px] text-zinc-400">
            Đã chọn: <strong className="text-white">{totalTickets} vé</strong>
          </span>
        </div>

        {/* DANH SÁCH CÁC LOẠI VÉ TRONG PHÂN KHU */}
        <div className="space-y-2.5">
          {event.zones.map((zone) => {
            const qty = selectedQuantities[zone.id] || 0;
            const isSelected = qty > 0;

            return (
              <div
                key={zone.id}
                onClick={() => onSelectZone(zone.id)}
                className={`flex items-center justify-between gap-2.5 rounded-lg border p-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#F97316] bg-[#F97316]/10 shadow-[0_0_12px_rgba(249,115,22,0.12)] ring-1 ring-[#F97316]"
                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                }`}
              >
                {/* Cột trái: Tên, Màu sắc, Giá & Quyền lợi */}
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div
                    className="h-8 w-1 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: zone.color }}
                  />
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white truncate">
                      {zone.name}
                    </h3>
                    <div className="text-xs font-extrabold text-[#F97316] mt-0.5">
                      {formatVND(zone.price)}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1 line-clamp-1">
                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                      <span>
                        {zone.benefits?.[0] ||
                          "Bao gồm quyền vào cửa và check-in QR"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bộ đếm số lượng vé (+ / -) */}
                <div className="flex items-center gap-1.5 shrink-0 bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuantityChange(zone.id, -1);
                    }}
                    disabled={qty <= 0}
                    className="h-6 w-6 rounded-md border border-zinc-700 bg-zinc-800 text-xs font-bold text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    -
                  </button>
                  <span className="w-5 text-center text-[11px] font-bold text-white font-mono">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuantityChange(zone.id, 1);
                    }}
                    disabled={qty >= 4}
                    className="h-6 w-6 rounded-md border border-zinc-700 bg-zinc-800 text-xs font-bold text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TỔNG KẾT & THANH TOÁN */}
      <div className="space-y-3 pt-3 border-t border-zinc-800">
        {/* Danh sách ghế đã chọn theo khu vực */}
        {totalTickets > 0 && (
          <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800 space-y-2 text-[11px]">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
              <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                <Armchair className="h-3.5 w-3.5 text-[#F97316]" />
                Chỗ ngồi theo từng khu vực:
              </span>
              <span className="text-[10px] text-zinc-400">
                Đã chọn:{" "}
                <strong className="text-white">
                  {allSelectedSeats.length}/{totalTickets} ghế
                </strong>
              </span>
            </div>

            <div className="space-y-1">
              {event.zones.map((zone) => {
                const qty = selectedQuantities[zone.id] || 0;
                if (qty === 0) return null;
                const seats = selectedSeatsByZone[zone.id] || [];
                const isCurrent = activeZoneId === zone.id;

                return (
                  <div
                    key={zone.id}
                    onClick={() => onSelectZone(zone.id)}
                    className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-colors ${
                      isCurrent
                        ? "bg-zinc-900 border border-[#F97316]/50 shadow-sm"
                        : "bg-zinc-900/40 hover:bg-zinc-900 border border-transparent"
                    }`}
                    title="Bấm để chuyển sang xem và chọn ghế khu vực này"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="font-medium text-white truncate text-[11px]">
                        {zone.name} ({qty} vé):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 shrink-0 ml-2">
                      {seats.length > 0 ? (
                        seats.map((s) => (
                          <span
                            key={s}
                            className="rounded bg-[#F97316] text-white px-1 py-0.2 text-[10px] font-bold shadow-sm"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-amber-400 text-[10px] font-medium">
                          Bấm để chọn ghế
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cổng thanh toán VietQR */}
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400">
              <QrCode className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-white flex items-center gap-1">
                Chuyển khoản VietQR / MoMo (Napas247)
                <Check className="h-3 w-3 text-emerald-400" />
              </div>
              <div className="text-[10px] text-zinc-400">
                Quét mã QR tự động xác nhận trong 3 giây
              </div>
            </div>
          </div>
        </div>

        {/* Khung tổng tiền & Nút Mua vé */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-zinc-950 p-3 border border-zinc-800">
          <div>
            <div className="text-[11px] text-zinc-400">
              Tổng tiền ({totalTickets} vé):
            </div>
            <div className="text-lg sm:text-xl font-black text-[#F97316]">
              {formatVND(totalPriceVND)}
            </div>
          </div>

          <button
            type="button"
            onClick={onBuyTicket}
            disabled={isProcessing || totalTickets === 0}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#F97316] hover:bg-[#ea6d0e] px-5 py-2.5 text-xs font-bold text-white transition-all shadow-[0_4px_16px_rgba(249,115,22,0.25)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Đang tạo đơn VietQR…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Thanh toán ngay
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
