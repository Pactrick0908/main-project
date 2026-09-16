import type { TicketDto } from "@/api/ticket.api";

interface TicketCardProps {
  ticket: TicketDto;
  onSelect: (ticket: TicketDto) => void;
  formatVND: (amount: number) => string;
}

export default function TicketCard({
  ticket,
  onSelect,
  formatVND,
}: TicketCardProps) {
  return (
    <li className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-white/20">
      {ticket.event?.bannerUrl && (
        <img
          src={ticket.event.bannerUrl}
          alt={ticket.event.title}
          className="h-36 w-full object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-medium leading-snug">{ticket.event?.title}</h2>
          <span
            className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
              ticket.isCheckedIn
                ? "bg-amber-500/20 text-amber-200"
                : "bg-emerald-500/20 text-emerald-200"
            }`}
          >
            {ticket.isCheckedIn ? "Đã check-in" : "Hợp lệ"}
          </span>
        </div>
        <p className="mt-2 text-sm text-white/55">
          {ticket.zoneName}
          {ticket.seatLabel ? ` · ${ticket.seatLabel}` : ""} · {formatVND(ticket.price)}
        </p>
        <button
          type="button"
          disabled={ticket.isCheckedIn}
          onClick={() => onSelect(ticket)}
          className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40 cursor-pointer transition-colors"
        >
          {ticket.isCheckedIn ? "Vé đã dùng" : "Hiện mã QR check-in"}
        </button>
      </div>
    </li>
  );
}
