import { Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TicketDto } from "@/api/ticket.api";

interface TicketPricingStepProps {
  passPrice: string;
  onPassPriceChange: (val: string) => void;
  sellerNote: string;
  onSellerNoteChange: (val: string) => void;
  selectedTicket?: TicketDto;
  formatVND: (amount: number) => string;
  isSubmitting: boolean;
  disabled: boolean;
}

export default function TicketPricingStep({
  passPrice,
  onPassPriceChange,
  selectedTicket,
  formatVND,
  isSubmitting,
  disabled,
}: TicketPricingStepProps) {
  return (
    <div className="space-y-3.5 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-zinc-400 font-medium block mb-1">
            Giá pass lại (VNĐ)
          </label>
          <Input
            required
            type="number"
            placeholder="VD: 2000000"
            value={passPrice}
            onChange={(e) => onPassPriceChange(e.target.value)}
            className="border-zinc-800 bg-zinc-900 text-white font-mono text-xs h-9 focus:border-[#F97316]"
          />
          {selectedTicket && (
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Giá gốc mua từ BTC: {formatVND(selectedTicket.price)}
            </span>
          )}
        </div>
      </div>

      {/* Cam kết an toàn Ký quỹ */}
      <div className="rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 p-2.5 text-[11px] text-zinc-300 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-[#F97316] shrink-0 mt-0.5" />
        <span>
          Tiền của người mua sẽ được hệ thống ký quỹ trung gian giữ an toàn và tự động
          chuyển về tài khoản ngân hàng trên sau khi người mua quét vé vào cổng thành
          công.
        </span>
      </div>

      {/* Nút Submit */}
      <div className="pt-1">
        <Button
          type="submit"
          disabled={disabled || isSubmitting}
          className="w-full rounded-xl bg-[#F97316] hover:bg-[#ea6d0e] text-white font-bold py-3 text-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              Đang niêm yết vé lên sàn...
            </>
          ) : (
            "Xác nhận niêm yết vé lên Chợ P2P"
          )}
        </Button>
      </div>
    </div>
  );
}
