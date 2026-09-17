import { useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { adminApi } from "@/api/admin.api";
import { toast } from "@/lib/toast";

type Folder = "artists" | "organizers" | "events" | "maps" | "misc";

type ImageUploadProps = {
  value?: string | null;
  onChange: (url: string) => void;
  onClear?: () => void;
  folder?: Folder;
  label?: string;
  /** avatar = circle preview, banner = wide */
  variant?: "avatar" | "banner" | "square";
  /** Preview nhỏ hơn, ẩn URL — dùng trong modal */
  compact?: boolean;
  className?: string;
  disabled?: boolean;
};

export function ImageUpload({
  value,
  onChange,
  onClear,
  folder = "misc",
  label = "Upload ảnh",
  variant = "square",
  compact = false,
  className,
  disabled,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewCls = compact
    ? variant === "avatar"
      ? "size-10 rounded-full"
      : variant === "banner"
        ? "h-12 w-20 rounded-md"
        : "size-12 rounded-md"
    : variant === "avatar"
      ? "size-16 rounded-full"
      : variant === "banner"
        ? "h-28 w-full rounded-xl"
        : "size-20 rounded-xl";

  const handleFile = async (file: File | null) => {
    if (!file || disabled) return;
    setError(null);
    setUploading(true);
    try {
      const res = await adminApi.uploadImage(file, folder);
      onChange(res.data.url);
      toast.success("Đã upload ảnh");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload thất bại";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <img
            src={value}
            alt=""
            className={cn(
              previewCls,
              "shrink-0 border border-border object-cover bg-muted",
            )}
          />
        ) : (
          <div
            className={cn(
              previewCls,
              "shrink-0 flex items-center justify-center border border-dashed border-border bg-zinc-400/80",
            )}
            aria-hidden
          >
            {variant !== "avatar" && (
              <ImageIcon
                className={cn(
                  "text-zinc-600/70",
                  compact ? "size-3.5" : "size-5",
                )}
              />
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted/50",
              (disabled || uploading) && "pointer-events-none opacity-60",
            )}
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            {uploading ? "Đang upload…" : label}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={disabled || uploading}
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {value && onClear && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-6 justify-start px-0 text-muted-foreground"
              disabled={disabled || uploading}
              onClick={onClear}
            >
              <X className="size-3" />
              Xóa ảnh
            </Button>
          )}
        </div>
      </div>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
