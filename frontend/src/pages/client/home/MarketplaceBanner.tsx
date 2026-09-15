import { ArrowRight, ShieldCheck, Ticket as TicketIcon } from "lucide-react";
import { Link } from "react-router-dom";

function MarketplaceBanner() {
  return (
    <section className="border-b border-zinc-800/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-zinc-800 bg-[#12131A] p-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-2xl">
              🔄
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Có vé nhưng không đi được?
              </h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-md">
                Đừng để vé bỏ phí. Đăng vé lên Chợ trao đổi — ai cần sẽ lấy,
                tiền về ví bạn sau khi họ vào cổng thành công. An toàn, không
                phí.
              </p>
              <div className="mt-2 flex items-center gap-4 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> Giao dịch
                  có bảo vệ
                </span>
                <span className="flex items-center gap-1">
                  <TicketIcon className="h-3 w-3 text-zinc-500" /> Vé được xác
                  minh
                </span>
              </div>
            </div>
          </div>
          <Link to="/marketplace" className="shrink-0">
            <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#F97316] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#ea6d0e] cursor-pointer">
              Vào chợ vé
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default MarketplaceBanner;
