import { Ticket } from "lucide-react";

export default function EmptyTicketState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/50 mb-3">
        <Ticket className="h-6 w-6" />
      </div>
      <p className="text-lg font-medium text-white/70">Chưa có vé nào</p>
      <p className="mt-1 text-sm text-white/40">
        Bấm &quot;+ Vé demo&quot; để tạo vé test hoặc mua vé sự kiện trực tiếp từ Trang chủ
      </p>
    </div>
  );
}
