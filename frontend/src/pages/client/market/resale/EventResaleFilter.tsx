import { Search, ArrowUpDown, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

interface EventResaleFilterProps {
  zones: string[];
  selectedZone: string;
  onSelectZone: (zone: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
  totalOffers: number;
}

export default function EventResaleFilter({
  zones,
  selectedZone,
  onSelectZone,
  searchQuery,
  onSearchChange,
  sortOrder,
  onToggleSort,
  totalOffers,
}: EventResaleFilterProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Top row: Search & Sort & Count */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Filter className="h-4 w-4 text-[#F97316]" />
            Danh sách người pass vé ({totalOffers})
          </div>
          <span className="text-xs text-zinc-500">
            — Lựa chọn mức giá & vị trí phù hợp với bạn
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <Input
              type="text"
              placeholder="Tìm người bán, ghi chú..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 w-full rounded-xl border-zinc-800 bg-[#12131A] pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-[#F97316]"
            />
          </div>

          {/* Sort Button */}
          <button
            type="button"
            onClick={onToggleSort}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-zinc-800 bg-[#12131A] px-3 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-[#F97316]" />
            <span>{sortOrder === "asc" ? "Giá tăng dần" : "Giá giảm dần"}</span>
          </button>
        </div>
      </div>

      {/* Zone filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => onSelectZone("all")}
          className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            selectedZone === "all"
              ? "bg-[#F97316] text-white shadow-md shadow-orange-500/20"
              : "border border-zinc-800 bg-[#12131A] text-zinc-400 hover:border-zinc-700 hover:text-white"
          }`}
        >
          Tất cả khu vực ({totalOffers})
        </button>

        {zones.map((zone) => (
          <button
            key={zone}
            type="button"
            onClick={() => onSelectZone(zone)}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              selectedZone === zone
                ? "bg-[#F97316] text-white shadow-md shadow-orange-500/20"
                : "border border-zinc-800 bg-[#12131A] text-zinc-400 hover:border-zinc-700 hover:text-white"
            }`}
          >
            {zone}
          </button>
        ))}
      </div>
    </div>
  );
}
