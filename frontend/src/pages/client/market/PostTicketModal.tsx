import { useState, useEffect } from "react";
import { Ticket as TicketIcon, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ticketApi, type TicketDto } from "@/api/ticket.api";
import { marketplaceApi } from "@/api/marketplace.api";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "@/lib/toast";

// Sub-components
import SelectTicketStep from "./post-ticket/SelectTicketStep";
import BankSelectorStep, { POPULAR_BANKS, type PopularBank } from "./post-ticket/BankSelectorStep";
import TicketPricingStep from "./post-ticket/TicketPricingStep";
import PostTicketSuccess from "./post-ticket/PostTicketSuccess";

interface PostTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PostTicketModal({
  isOpen,
  onClose,
  onSuccess,
}: PostTicketModalProps) {
  const { user, isAuthenticated } = useAuth();

  // 1. Danh sách vé
  const [myTickets, setMyTickets] = useState<TicketDto[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // 2. Tài khoản ngân hàng (User tự điền)
  const [selectedBank, setSelectedBank] = useState<PopularBank>(POPULAR_BANKS[0]); // Mặc định MB
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  // 3. Giá pass & Lý do
  const [passPrice, setPassPrice] = useState("");
  const [sellerNote, setSellerNote] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listSuccess, setListSuccess] = useState(false);

  const formatVND = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  // Tải danh sách vé từ my-tickets và khởi tạo tên người dùng nếu có
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      // if (user?.name && !accountName) {
      //   setAccountName(user.name.toUpperCase());
      // }

      setLoadingTickets(true);
      ticketApi
        .listMine()
        .then((res) => {
          const validTickets = (res.data?.tickets || []).filter(
            (t) => !t.isCheckedIn && t.status !== "listed",
          );
          setMyTickets(validTickets);
          if (validTickets.length > 0) {
            setSelectedTicketId(validTickets[0].id);
            setPassPrice(validTickets[0].price.toString());
          }
        })
        .catch(() => {})
        .finally(() => setLoadingTickets(false));
    }
  }, [isOpen, isAuthenticated, user]);

  const selectedTicket = myTickets.find((t) => t.id === selectedTicketId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId) {
      toast.error("Vui lòng chọn vé bạn muốn đăng bán!");
      return;
    }
    if (!accountNumber.trim()) {
      toast.error("Vui lòng điền số tài khoản nhận tiền!");
      return;
    }
    if (!accountName.trim()) {
      toast.error("Vui lòng điền tên chủ tài khoản nhận tiền!");
      return;
    }

    setIsSubmitting(true);
    try {
      await marketplaceApi.createListing({
        ticketId: selectedTicketId,
        price: Number(passPrice.replace(/\D/g, "")) || Number(passPrice),
        bankCode: selectedBank.code,
        bankName: selectedBank.name,
        bankAccountNo: accountNumber.trim(),
        bankAccountName: accountName.trim(),
        note: sellerNote.trim() || undefined,
      });
      setListSuccess(true);
      setTimeout(() => {
        setListSuccess(false);
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      toast.error(err?.message || "Đăng bán thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-zinc-800 bg-[#0E0F16] text-white p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
            <TicketIcon className="h-4 w-4 text-[#F97316]" />
            Đăng Bán Vé Lên Chợ P2P
          </DialogTitle>
        </DialogHeader>

        {listSuccess ? (
          <PostTicketSuccess />
        ) : !isAuthenticated ? (
          <div className="py-8 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-amber-400 mx-auto" />
            <p className="text-sm text-zinc-300 font-semibold">
              Bạn cần đăng nhập để lấy danh sách vé của mình
            </p>
            <Link to="/login" onClick={onClose}>
              <Button className="rounded-xl bg-[#F97316] hover:bg-[#ea6d0e] text-white font-bold text-xs mt-2">
                Đăng nhập ngay
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3 space-y-4">
            {/* 1. Chọn vé từ my-tickets */}
            <SelectTicketStep
              myTickets={myTickets}
              loadingTickets={loadingTickets}
              selectedTicketId={selectedTicketId}
              onSelectTicket={(ticket) => {
                setSelectedTicketId(ticket.id);
                setPassPrice(ticket.price.toString());
              }}
              formatVND={formatVND}
            />

            {/* 2. Chọn Ngân hàng (Nút có Logo) + Tự điền STK & Tên chủ sở hữu (bự ngang) */}
            <BankSelectorStep
              selectedBank={selectedBank}
              onSelectBank={setSelectedBank}
              accountNumber={accountNumber}
              onAccountNumberChange={setAccountNumber}
              accountName={accountName}
              onAccountNameChange={setAccountName}
            />

            {/* 3. Giá pass, Lý do & Nút submit */}
            <TicketPricingStep
              passPrice={passPrice}
              onPassPriceChange={setPassPrice}
              sellerNote={sellerNote}
              onSellerNoteChange={setSellerNote}
              selectedTicket={selectedTicket}
              formatVND={formatVND}
              isSubmitting={isSubmitting}
              disabled={myTickets.length === 0}
            />
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
