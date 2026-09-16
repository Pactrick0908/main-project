import { useState } from "react";
import { Map, Maximize2, Sparkles } from "lucide-react";
import type { EventZone } from "@/data/events.data";

interface VenueSeatmapProps {
  zones: EventZone[];
  selectedZone: EventZone;
  onSelectZone: (zone: EventZone) => void;
  formatVND: (amount: number) => string;
}

export default function VenueSeatmap({
  zones,
  selectedZone,
  onSelectZone,
  formatVND,
}: VenueSeatmapProps) {
  const [viewMode, setViewMode] = useState<"interactive" | "real">("interactive");
  const [isZoomed, setIsZoomed] = useState(false);

  // Helper tìm zone theo id hoặc index
  const getZone = (idx: number) => zones[idx] || zones[0];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#12131A] p-5 sm:p-6 space-y-4">
      {/* Header Seatmap */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-[#F97316]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Sơ Đồ Khán Đài &amp; Vị Trí Ngồi
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Bấm vào khu vực trên sơ đồ hoặc chọn danh sách bên dưới để xem vị trí
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setViewMode("interactive")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              viewMode === "interactive"
                ? "bg-[#F97316] text-white font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Sơ đồ tương tác
          </button>
          <button
            type="button"
            onClick={() => setViewMode("real")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              viewMode === "real"
                ? "bg-[#F97316] text-white font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Ảnh sơ đồ thực tế
          </button>
        </div>
      </div>

      {/* ── CHẾ ĐỘ 1: SƠ ĐỒ VECTOR TƯƠNG TÁC (INTERACTIVE SEATMAP) ──────── */}
      {viewMode === "interactive" && (
        <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-[#090A0F] p-4 sm:p-6 select-none">
          {/* SÂN KHẤU CHÍNH (STAGE) */}
          <div className="mx-auto max-w-sm text-center mb-6">
            <div className="relative overflow-hidden rounded-xl border border-zinc-700/80 bg-gradient-to-b from-zinc-800 to-zinc-900 py-3 shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <div className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-200">
                ★ STAGE · SÂN KHẤU CHÍNH ★
              </div>
              <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
                ÂM THANH &amp; ÁNH SÁNG D-LINE QUỐC TẾ
              </div>
              {/* Runway / Catwalk bar */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-24 bg-[#F97316] rounded-t" />
            </div>
            {/* Sàn catwalk vươn ra */}
            <div className="mx-auto w-12 h-6 bg-zinc-800 border-x border-b border-zinc-700/80" />
          </div>

          {/* KHU VỰC KHÁN ĐÀI & CÁC ZONE */}
          <div className="mx-auto max-w-lg space-y-3">
            {/* Hàng 1: Khu sát sân khấu (SVIP & VIP) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {zones.slice(0, 2).map((zone) => {
                const isSelected = selectedZone.id === zone.id;
                return (
                  <div
                    key={zone.id}
                    onClick={() => onSelectZone(zone)}
                    className={`relative rounded-xl p-3.5 text-center transition-all cursor-pointer border ${
                      isSelected
                        ? "border-[#F97316] bg-[#F97316]/20 shadow-[0_0_25px_rgba(249,115,22,0.3)] ring-2 ring-[#F97316]"
                        : "border-zinc-800/90 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-800/60"
                    }`}
                  >
                    <div
                      className="absolute top-2 right-2 h-2 w-2 rounded-full"
                      style={{ backgroundColor: zone.color }}
                    />
                    <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                      {zone.name}
                      {isSelected && (
                        <span className="text-[10px] bg-[#F97316] text-white px-1.5 py-0.2 rounded font-mono">
                          ĐANG CHỌN
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-extrabold text-[#F97316] mt-1">
                      {formatVND(zone.price)}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Khu vực cận sân khấu VIP
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hàng 2: Khán đài CAT 1 */}
            {zones.length > 2 && (
              <div
                onClick={() => onSelectZone(getZone(2))}
                className={`relative rounded-xl p-3 text-center transition-all cursor-pointer border ${
                  selectedZone.id === getZone(2).id
                    ? "border-[#F97316] bg-[#F97316]/20 shadow-[0_0_25px_rgba(249,115,22,0.3)] ring-2 ring-[#F97316]"
                    : "border-zinc-800/90 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/60"
                }`}
              >
                <div
                  className="absolute top-2 right-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: getZone(2).color }}
                />
                <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                  {getZone(2).name}
                  {selectedZone.id === getZone(2).id && (
                    <span className="text-[10px] bg-[#F97316] text-white px-1.5 py-0.2 rounded font-mono">
                      ĐANG CHỌN
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-extrabold text-[#F97316] mt-0.5">
                  {formatVND(getZone(2).price)}
                </div>
                <div className="text-[10px] text-zinc-400">
                  Khán đài tầng 1 · Tầm nhìn chính diện bao quát
                </div>
              </div>
            )}

            {/* Hàng 3: Khán đài CAT 2 */}
            {zones.length > 3 && (
              <div
                onClick={() => onSelectZone(getZone(3))}
                className={`relative rounded-xl p-3 text-center transition-all cursor-pointer border ${
                  selectedZone.id === getZone(3).id
                    ? "border-[#F97316] bg-[#F97316]/20 shadow-[0_0_25px_rgba(249,115,22,0.3)] ring-2 ring-[#F97316]"
                    : "border-zinc-800/90 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/60"
                }`}
              >
                <div
                  className="absolute top-2 right-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: getZone(3).color }}
                />
                <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                  {getZone(3).name}
                  {selectedZone.id === getZone(3).id && (
                    <span className="text-[10px] bg-[#F97316] text-white px-1.5 py-0.2 rounded font-mono">
                      ĐANG CHỌN
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-extrabold text-[#F97316] mt-0.5">
                  {formatVND(getZone(3).price)}
                </div>
                <div className="text-[10px] text-zinc-400">
                  Khán đài tầng 2 · Không gian thoáng đãng
                </div>
              </div>
            )}
          </div>

          {/* Legend / Chú thích màu sắc */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            {zones.map((z) => (
              <div
                key={z.id}
                onClick={() => onSelectZone(z)}
                className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: z.color }}
                />
                <span>{z.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CHẾ ĐỘ 2: ẢNH SƠ ĐỒ THỰC TẾ TỪ BAN TỔ CHỨC ─────────────────── */}
      {viewMode === "real" && (
        <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
          <img
            src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80"
            alt="Sơ đồ khán đài thực tế"
            className={`w-full object-cover transition-transform duration-300 ${
              isZoomed ? "scale-125 cursor-zoom-out" : "h-[340px] cursor-zoom-in"
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs">
            <span className="text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#F97316]" />
              Sơ đồ chính thức do Ban Tổ Chức phát hành
            </span>
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              className="text-xs text-white font-medium flex items-center gap-1 hover:text-[#F97316] transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              {isZoomed ? "Thu nhỏ" : "Phóng to"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
