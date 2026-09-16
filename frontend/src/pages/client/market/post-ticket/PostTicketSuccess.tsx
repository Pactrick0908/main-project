import { CheckCircle2 } from "lucide-react";

export default function PostTicketSuccess() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-3.5">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <p className="text-base font-bold text-white">Đăng bán vé thành công!</p>
      <p className="mt-1.5 text-xs text-zinc-400 max-w-sm">
        Vé đã được niêm yết lên sàn Chợ vé P2P. Khi người khác thanh toán qua VietQR, tiền sẽ được hệ thống ký quỹ tự động giải ngân thẳng về tài khoản ngân hàng của bạn sau khi quét vé thành công!
      </p>
    </div>
  );
}
