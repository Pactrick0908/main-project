import { Check, CheckCircle2 } from "lucide-react";
import type { EventZone } from "@/data/events.data";

interface EventZoneSelectorProps {
  zones: EventZone[];
  selectedZone: EventZone;
  onSelectZone: (zone: EventZone) => void;
  quantity: number;
  onQuantityChange: (delta: number) => void;
  formatVND: (amount: number) => string;
}

export default function EventZoneSelector({
  zones,
  selectedZone,
  onSelectZone,
  quantity,
  onQuantityChange,
  formatVND,
}: EventZoneSelectorProps) {
  return (
    <div className="space-y-6">
      {/* BƯỚC 1: CHỌN HẠNG VÉ */}
      <div className="rounded-2xl border border-zinc-800 bg-[#12131A] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F97316] text-[11px] font-bold text-white">
              1
            </div>
            <h2 className="text-base font-bold text-white">Chọn hạng vé của bạn</h2>
          </div>
          <span className="text-xs text-zinc-500 font-medium">Giá đã gồm thuế VAT</span>
        </div>

        {/* Danh sách các Zone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {zones.map((zone) => {
            const isSelected = selectedZone.id === zone.id;
            return (
              <div
                key={zone.id}
                onClick={() => onSelectZone(zone)}
                className={`relative flex flex-col justify-between rounded-xl p-4 cursor-pointer transition-all border ${
                  isSelected
                    ? "border-[#F97316] bg-[#F97316]/10 shadow-[0_0_20px_rgba(249,115,22,0.15)] ring-1 ring-[#F97316]"
                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900"
                }`}
              >
                {/* Color indicator bar */}
                <div
                  className="absolute top-0 left-0 bottom-0 w-1 rounded-l-xl"
                  style={{ backgroundColor: zone.color }}
                />

                <div className="pl-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">{zone.name}</h3>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F97316] text-white">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5">
                    <span className="text-base font-extrabold text-[#F97316]">
                      {formatVND(zone.price)}
                    </span>
                  </div>

                  {/* Benefits list */}
                  <ul className="mt-3 space-y-1.5 border-t border-zinc-800/80 pt-2.5">
                    {zone.benefits.map((b, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="line-clamp-1">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BƯỚC 2: CHỌN SỐ LƯỢNG */}
      <div className="rounded-2xl border border-zinc-800 bg-[#12131A] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F97316] text-[11px] font-bold text-white">
            2
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Số lượng vé</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tối đa 4 vé mỗi giao dịch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onQuantityChange(-1)}
            disabled={quantity <= 1}
            className="h-9 w-9 rounded-lg border border-zinc-700 bg-zinc-800 font-bold text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            -
          </button>
          <span className="w-8 text-center text-base font-bold text-white font-mono">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(1)}
            disabled={quantity >= 4}
            className="h-9 w-9 rounded-lg border border-zinc-700 bg-zinc-800 font-bold text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
