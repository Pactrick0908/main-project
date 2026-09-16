import { Building2, CreditCard, User } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface PopularBank {
  id: string;
  name: string;
  code: string;
  logo: string;
}

export const POPULAR_BANKS: PopularBank[] = [
  {
    id: "mb",
    name: "MB Bank",
    code: "MB",
    logo: "https://api.vietqr.io/img/MB.png",
  },
  {
    id: "vcb",
    name: "Vietcombank",
    code: "VCB",
    logo: "https://api.vietqr.io/img/VCB.png",
  },
  {
    id: "tcb",
    name: "Techcombank",
    code: "TCB",
    logo: "https://api.vietqr.io/img/TCB.png",
  },
  {
    id: "acb",
    name: "ACB",
    code: "ACB",
    logo: "https://api.vietqr.io/img/ACB.png",
  },
  {
    id: "vpb",
    name: "VPBank",
    code: "VPB",
    logo: "https://api.vietqr.io/img/VPB.png",
  },
  {
    id: "bidv",
    name: "BIDV",
    code: "BIDV",
    logo: "https://api.vietqr.io/img/BIDV.png",
  },
  {
    id: "ctg",
    name: "VietinBank",
    code: "CTG",
    logo: "https://api.vietqr.io/img/ICB.png",
  },
  {
    id: "momo",
    name: "Ví MoMo",
    code: "MOMO",
    logo: "https://api.vietqr.io/img/momo.png",
  },
];

interface BankSelectorStepProps {
  selectedBank: PopularBank;
  onSelectBank: (bank: PopularBank) => void;
  accountNumber: string;
  onAccountNumberChange: (acc: string) => void;
  accountName: string;
  onAccountNameChange: (name: string) => void;
}

export default function BankSelectorStep({
  selectedBank,
  onSelectBank,
  accountNumber,
  onAccountNumberChange,
  accountName,
  onAccountNameChange,
}: BankSelectorStepProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 space-y-3.5">
      <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs">
        <Building2 className="h-4 w-4 text-emerald-400" />
        <span>2. Tài khoản ngân hàng nhận tiền (VietQR / Chuyển khoản):</span>
      </div>

      {/* DANH SÁCH CÁC NGÂN HÀNG PHỔ BIẾN + MOMO DẠNG NÚT CÓ LOGO */}
      <div>
        <label className="text-zinc-400 text-[11px] block mb-2 font-medium">
          Chọn ngân hàng hoặc ví thụ hưởng:
        </label>
        <div className="grid grid-cols-4 gap-2">
          {POPULAR_BANKS.map((bank) => {
            const isSelected = selectedBank.id === bank.id;
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => onSelectBank(bank)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#F97316] bg-[#F97316]/15 ring-2 ring-[#F97316] shadow-[0_0_12px_rgba(249,115,22,0.25)]"
                    : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 hover:bg-zinc-800/60"
                }`}
              >
                <div className="h-6 w-10 flex items-center justify-center bg-white/10 rounded p-0.5 mb-1">
                  <img
                    src={bank.logo}
                    alt={bank.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <span
                  className={`text-[10px] font-bold truncate max-w-full ${
                    isSelected ? "text-[#F97316]" : "text-zinc-300"
                  }`}
                >
                  {bank.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SỐ TÀI KHOẢN */}
      <div>
        <label className="text-zinc-400 text-[11px] block mb-1">
          <span className="flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            Số tài khoản / Số điện thoại nhận tiền
          </span>
        </label>
        <Input
          required
          type="text"
          placeholder="Nhập số tài khoản ngân hàng..."
          value={accountNumber}
          onChange={(e) =>
            onAccountNumberChange(e.target.value.replace(/\s+/g, ""))
          }
          className="border-zinc-800 bg-zinc-900 text-white font-mono text-sm h-10 tracking-wider focus:border-[#F97316]"
        />
      </div>

      {/* TÊN CHỦ SỞ HỮU TÀI KHOẢN (NGƯỜI DÙNG TỰ ĐIỀN, HIỂN THỊ TO BỰ HẾT CHIỀU NGANG) */}
      <div className="pt-0.5">
        <label className="text-zinc-300 text-xs font-bold block mb-1.5 flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-emerald-400" />
          Tên chủ tài khoản (Viết in hoa không dấu)
        </label>
        <Input
          required
          type="text"
          placeholder="VD: NGUYEN VAN A"
          value={accountName}
          onChange={(e) => onAccountNameChange(e.target.value.toUpperCase())}
          className="w-full border-zinc-800 bg-zinc-900 text-white font-mono text-sm sm:text-base font-black h-11 px-3.5 tracking-wider uppercase focus:border-[#F97316]"
        />
        <p className="text-[10px] text-zinc-500 mt-1">
          * Vui lòng điền đúng tên trên thẻ/tài khoản ngân hàng để người mua
          chuyển khoản chính xác.
        </p>
      </div>
    </div>
  );
}
