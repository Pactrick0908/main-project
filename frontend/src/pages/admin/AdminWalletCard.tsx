import { useState } from "react";
import {
  Copy,
  Check,
  Wallet,
  ExternalLink,
  QrCode,
  AlertTriangle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/toast";
import { cn } from "cn";
import type { AdminWalletStatus } from "@/api/admin.api";

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

function formatSol(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function AdminWalletCard({ wallet }: { wallet: AdminWalletStatus }) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const address = wallet.address ?? "";
  const isCritical = wallet.status === "critical";
  const isLow = wallet.status === "low";
  const isSafe = wallet.status === "safe";

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Đã copy địa chỉ ví");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Không copy được địa chỉ ví");
    }
  };

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden",
          isSafe && "border-emerald-500/40",
          isLow && "border-amber-500/50",
          isCritical && "border-destructive/60",
          wallet.status === "unknown" && "border-border",
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "mt-0.5 rounded-md p-1.5",
                isSafe && "bg-emerald-500/15 text-emerald-400",
                isLow && "bg-amber-500/15 text-amber-400",
                isCritical && "bg-destructive/15 text-destructive",
                wallet.status === "unknown" &&
                  "bg-muted text-muted-foreground",
              )}
            >
              <Wallet className="size-4" />
            </div>
            <div className="min-w-0">
              <CardTitle>Ví mint admin</CardTitle>
              <CardDescription>
                Hot wallet ghi vé on-chain · {wallet.cluster ?? "devnet"}
              </CardDescription>
            </div>
          </div>
          {isSafe && (
            <Badge className="rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">
              An toàn
            </Badge>
          )}
          {isLow && (
            <Badge className="rounded-md bg-amber-500/15 text-amber-400 hover:bg-amber-500/15">
              Sắp hết phí gas, hãy nạp thêm
            </Badge>
          )}
          {isCritical && (
            <Badge
              variant="destructive"
              className="rounded-md"
            >
              Nguy cấp
            </Badge>
          )}
          {wallet.status === "unknown" && (
            <Badge variant="secondary" className="rounded-md">
              Không đọc được số dư
            </Badge>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Địa chỉ ví
            </p>
            {address ? (
              <div className="mt-1.5 flex items-center gap-1.5">
                <code
                  className="min-w-0 truncate font-mono text-sm"
                  title={address}
                >
                  {shortAddress(address)}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  title="Copy địa chỉ"
                  onClick={() => void copyAddress()}
                >
                  {copied ? (
                    <Check className="size-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
                {wallet.explorerUrl && (
                  <a
                    href={wallet.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                    title="Mở Solana Explorer"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-destructive">
                {wallet.error || "Chưa cấu hình SERVER_PRIVATE_KEY"}
              </p>
            )}
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Số dư SOL
            </p>
            <p
              className={cn(
                "mt-1 text-2xl font-semibold tracking-tight",
                isSafe && "text-emerald-400",
                isLow && "text-amber-400",
                isCritical && "text-destructive",
              )}
            >
              {wallet.reachable ? `${formatSol(wallet.solBalance)} SOL` : "—"}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ước tính còn tạo được
            </p>
            <p className="mt-1 text-lg font-semibold">
              {wallet.reachable
                ? `~${wallet.estimatedTickets.toLocaleString("vi-VN")} vé`
                : "—"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              ~{wallet.costPerTicket} SOL / vé ghi on-chain
            </p>
          </div>

          <div className="flex items-end">
            {isSafe && (
              <p className="text-xs text-emerald-400/90">
                Hệ thống hoạt động bình thường.
              </p>
            )}
            {isLow && (
              <p className="flex items-start gap-1.5 text-xs text-amber-400">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                Sắp hết phí gas, hãy nạp thêm SOL vào ví mint.
              </p>
            )}
            {isCritical && (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => setQrOpen(true)}
                disabled={!address}
              >
                <QrCode className="size-3.5" />
                Nạp SOL ngay
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        open={qrOpen}
        onOpenChange={setQrOpen}
        title="Nạp SOL vào ví admin"
        description="Quét mã bằng Phantom / Solflare để chuyển SOL vào ví mint."
        size="sm"
        hideCancel
        confirmLabel="Đóng"
        onConfirm={() => setQrOpen(false)}
      >
        {address && (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG
                value={address}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
            <code className="w-full break-all rounded-lg bg-muted px-2.5 py-2 text-center font-mono text-[11px]">
              {address}
            </code>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void copyAddress()}
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Copy className="size-3.5" />
              )}
              Copy địa chỉ
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
