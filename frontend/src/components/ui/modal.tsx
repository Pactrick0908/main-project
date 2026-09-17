import * as React from "react";
import { cn } from "cn";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>["variant"]
>;

const sizeClass = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
} as const;

export type ModalSize = keyof typeof sizeClass;

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  className?: string;
  /** Built-in confirm / cancel footer (ignored when `footer` is set) */
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  onConfirm?: () => void | Promise<void>;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  hideCancel?: boolean;
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "sm",
  showCloseButton = true,
  className,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  confirmVariant = "default",
  onConfirm,
  confirmLoading = false,
  confirmDisabled = false,
  hideCancel = false,
}: ModalProps) {
  const [internalBusy, setInternalBusy] = React.useState(false);
  const busy = confirmLoading || internalBusy;

  const handleConfirm = async () => {
    if (!onConfirm || busy) return;
    try {
      setInternalBusy(true);
      await onConfirm();
    } finally {
      setInternalBusy(false);
    }
  };

  const builtInFooter =
    onConfirm != null ? (
      <>
        {!hideCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type="button"
          variant={confirmVariant}
          disabled={busy || confirmDisabled}
          onClick={() => void handleConfirm()}
        >
          {busy ? "Đang xử lý…" : confirmLabel}
        </Button>
      </>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(sizeClass[size], className)}
      >
        {(title != null || description != null) && (
          <DialogHeader>
            {title != null && <DialogTitle>{title}</DialogTitle>}
            {description != null && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}

        {children}

        {(footer != null || builtInFooter != null) && (
          <DialogFooter>{footer ?? builtInFooter}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
