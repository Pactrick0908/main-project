import { Loader2 } from "lucide-react";
import type { TicketDto } from "@/api/ticket.api";

interface SelectTicketStepProps {
  myTickets: TicketDto[];
  loadingTickets: boolean;
  selectedTicketId: number | null;
  onSelectTicket: (ticket: TicketDto) => void;
  formatVND: (amount: number) => string;
}

export default function SelectTicketStep({
  myTickets,
  loadingTickets,
  selectedTicketId,
  onSelectTicket,
  formatVND,
}: SelectTicketStepProps) {
  return (
    <div>
      <label className="text-zinc-300 font-bold block mb-1.5 flex items-center justify-between text-xs">
        <span>1. Chọn vé cần pass (từ &quot;Vé của tôi&quot;):</span>
        <span className="text-[11px] text-zinc-500 font-normal">
          {myTickets.length} vé hợp lệ
        </span>
      </label>

      {loadingTickets ? (
        <div className="flex items-center justify-center py-6 border border-zinc-800 rounded-xl bg-zinc-900/50 text-zinc-400 gap-2 text-xs">
          <Loader2 className="h-4 w-4 animate-spin text-[#F97316]" />
          Đang tải vé của bạn...
        </div>
      ) : myTickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-4 text-center text-xs">
          <p className="text-zinc-400">Bạn chưa có vé nào hợp lệ để pass lại.</p>
          <p className="text-zinc-500 text-[11px] mt-1">
            Hãy vào mục &quot;Vé của tôi&quot; bấm <strong>&quot;+ Vé demo&quot;</strong> để tạo vé test nhé.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
          {myTickets.map((t) => {
            const isSelected = selectedTicketId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => onSelectTicket(t)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "border-[#F97316] bg-[#F97316]/10 ring-1 ring-[#F97316]"
                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white truncate text-xs">
                    {t.event?.title || "Sự kiện âm nhạc"}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Hạng: <span className="text-zinc-200">{t.zoneName}</span>
                    {t.seatLabel ? ` · Ghế ${t.seatLabel}` : ""}
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <div className="text-xs font-bold text-[#F97316]">
                    {formatVND(t.price)}
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Hợp lệ
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
