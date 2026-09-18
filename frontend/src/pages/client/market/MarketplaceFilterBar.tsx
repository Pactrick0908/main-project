import { Search, ArrowUpDown } from "lucide-react";

interface MarketplaceFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
}

export default function MarketplaceFilterBar({
  searchQuery,
  onSearchChange,
  sortOrder,
  onToggleSort,
}: MarketplaceFilterBarProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm theo tên sự kiện, nghệ sĩ, địa điểm..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 pl-9 pr-4 text-xs text-white placeholder:text-zinc-500 focus:border-[#F97316] focus:outline-none transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={onToggleSort}
          className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
          Giá: {sortOrder === "asc" ? "Thấp đến cao" : "Cao đến thấp"}
        </button>
      </div>
    </div>
  );
}
