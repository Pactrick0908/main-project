import { Search, ArrowUpDown } from "lucide-react";
import { CATEGORIES } from "./marketplace.data";

interface MarketplaceFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
}

export default function MarketplaceFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  sortOrder,
  onToggleSort,
}: MarketplaceFilterBarProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
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

        {/* Sort Button */}
        <button
          onClick={onToggleSort}
          className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
          Giá: {sortOrder === "asc" ? "Thấp đến cao" : "Cao đến thấp"}
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-[#F97316] text-white font-bold"
                : "border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
