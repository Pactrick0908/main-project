import { Store, ShieldCheck, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarketplaceHeroProps {
  onOpenListModal: () => void;
}

export default function MarketplaceHero({ onOpenListModal }: MarketplaceHeroProps) {
  return (
    <div className="mb-8 border-b border-zinc-800 pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F97316]">
            <Store className="h-3.5 w-3.5" />
            Chợ Vé P2P
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Sàn Trao Đổi Vé An Toàn
          </h1>
          <p className="mt-1 text-xs text-zinc-400 max-w-xl">
            Mua vé trực tiếp từ cộng đồng. Tiền của bạn được bảo vệ qua cơ chế{" "}
            <span className="text-zinc-200 font-medium">Ký quỹ trung gian an toàn</span> — chỉ giải ngân cho người bán
            khi bạn quét mã vào cổng thành công.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={onOpenListModal}
            className="flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2 text-xs font-bold text-white hover:bg-[#ea6d0e] transition-colors cursor-pointer"
          >
            <TicketIcon className="h-3.5 w-3.5" />
            Đăng bán vé của bạn
          </Button>
        </div>
      </div>

      {/* Trust chips */}
      <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-zinc-400">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          Ký quỹ trung gian an toàn
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          Xác thực vé chính hãng 100%
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1">
          0% Phí sàn cho người mua
        </span>
      </div>
    </div>
  );
}
