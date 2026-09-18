import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/context/AuthContext";
import type { ConfirmModalState } from "@/pages/admin/adminShared";
import NotFoundPage from "@/pages/NotFoundPage";

type HeaderAdminProps = {
  title: string;
  description: string;
  lastUpdated?: string;
  onRefresh?: () => void;
  showCreateEvent?: boolean;
  actions?: ReactNode;
};

export function HeaderAdmin({
  title,
  description,
  onRefresh,
  actions,
}: HeaderAdminProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-6 backdrop-blur-md sm:px-8">
      <div className="flex h-14 items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="whitespace-nowrap text-base font-semibold tracking-tight">
              {title}
            </h1>
            {user?.role && (
              <Badge variant="secondary" className="rounded-md capitalize">
                {user.role}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void onRefresh()}
              title="Làm mới"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          )}
          {actions}
        </div>
      </div>
    </header>
  );
}

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const { staffRole } = useAuth();
  if (!staffRole) {
    return <NotFoundPage />;
  }
  return <>{children}</>;
}

type AdminPageShellProps = {
  title: string;
  description: string;
  lastUpdated?: string;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  showCreateEvent?: boolean;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPageShell({
  title,
  description,
  loading,
  error,
  onRefresh,
  actions,
  children,
}: AdminPageShellProps) {
  return (
    <AdminAuthGate>
      <div className="flex min-h-screen flex-col">
        <HeaderAdmin
          title={title}
          description={description}
          onRefresh={onRefresh}
          actions={actions}
        />
        <main className="flex-1 space-y-6 p-6 sm:p-8">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {loading ? (
            <LoadingSpinner
              label="Đang tải dữ liệu…"
              className="min-h-[50vh]"
              size="lg"
            />
          ) : (
            children
          )}
        </main>
      </div>
    </AdminAuthGate>
  );
}

export function AdminConfirmModal({
  modal,
  setModal,
}: {
  modal: ConfirmModalState | null;
  setModal: (m: ConfirmModalState | null) => void;
}) {
  return (
    <Modal
      open={modal != null}
      onOpenChange={(open) => {
        if (!open) setModal(null);
      }}
      title={modal?.title}
      description={modal?.description}
      confirmLabel={
        modal?.kind === "confirm"
          ? (modal.confirmLabel ?? "Xác nhận")
          : "Đã hiểu"
      }
      confirmVariant={
        modal?.kind === "confirm"
          ? (modal.confirmVariant ?? "default")
          : "default"
      }
      hideCancel={modal?.kind === "alert"}
      onConfirm={
        modal?.kind === "confirm"
          ? async () => {
              try {
                await modal.onConfirm();
              } catch (err) {
                setModal({
                  kind: "alert",
                  title: "Thất bại",
                  description:
                    err instanceof Error
                      ? err.message
                      : "Không thể thực hiện thao tác",
                });
              }
            }
          : async () => {
              setModal(null);
            }
      }
    />
  );
}
