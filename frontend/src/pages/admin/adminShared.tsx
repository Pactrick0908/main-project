import { cn } from "cn";
import { Badge } from "@/components/ui/badge";

export type ConfirmModalState =
  | {
      kind: "confirm";
      title: string;
      description: string;
      confirmLabel?: string;
      confirmVariant?: "default" | "destructive";
      onConfirm: () => Promise<void>;
    }
  | {
      kind: "alert";
      title: string;
      description: string;
    };

export const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount,
  );

/** Preview nhãn hàng: 0→A, 25→Z, 26→AA */
export function rowLabelPreview(rowIndex: number): string {
  if (rowIndex < 0) return "A";
  let n = rowIndex;
  let label = "";
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

export function StatusBadge({ status }: { status: string }) {
  const normalized =
    status === "active" || status === "published"
      ? "open"
      : status === "completed" || status === "finished"
        ? "ended"
        : status;

  const map: Record<string, string> = {
    open: "bg-success/15 text-success",
    upcoming: "bg-sky-500/15 text-sky-400",
    draft: "bg-muted text-muted-foreground",
    ended: "bg-muted text-muted-foreground",
  };
  const label: Record<string, string> = {
    open: "Đang mở bán",
    upcoming: "Sắp diễn ra",
    draft: "Nháp",
    ended: "Đã kết thúc",
  };
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-md",
        map[normalized] ?? "bg-muted text-muted-foreground",
      )}
    >
      {label[normalized] ?? status}
    </Badge>
  );
}
