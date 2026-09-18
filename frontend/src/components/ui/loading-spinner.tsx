import { Loader2 } from "lucide-react";
import { cn } from "cn";

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE = {
  sm: "size-6",
  md: "size-9",
  lg: "size-12",
} as const;

/** Vòng tròn loading khi API chưa về. */
export function LoadingSpinner({
  label = "Đang tải…",
  className,
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex min-h-[10rem] flex-col items-center justify-center gap-3",
        className,
      )}
    >
      <Loader2
        className={cn(SIZE[size], "animate-spin text-[#F97316]")}
        aria-hidden
      />
      {label ? (
        <p className="text-xs text-zinc-500">{label}</p>
      ) : null}
      <span className="sr-only">{label || "Đang tải"}</span>
    </div>
  );
}
