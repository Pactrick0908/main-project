import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/context/AuthContext";
import type { ConfirmModalState } from "@/pages/admin/adminShared";

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
  lastUpdated,
  onRefresh,
  showCreateEvent = true,
  actions,
}: HeaderAdminProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-6 backdrop-blur-md sm:px-8">
      <div className="flex h-14 items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="whitespace-nowrap text-base font-semibold tracking-tight">
              {title}
            </h1>
            {lastUpdated && (
              <span className="hidden rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground lg:inline">
                Live · {lastUpdated}
              </span>
            )}
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
          {showCreateEvent && (
            <Button size="sm" onClick={() => navigate("/admin/events")}>
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Thêm sự kiện</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <ShieldAlert className="size-10 text-primary" />
        <h1 className="text-xl font-semibold">Cần đăng nhập Admin</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Bấm <strong>Đăng nhập Admin</strong> ở sidebar để vào tài khoản vận
          hành và dùng đầy đủ nghiệp vụ.
        </p>
      </div>
    );
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
  lastUpdated,
  loading,
  error,
  onRefresh,
  showCreateEvent,
  actions,
  children,
}: AdminPageShellProps) {
  return (
    <AdminAuthGate>
      <div className="flex min-h-screen flex-col">
        <HeaderAdmin
          title={title}
          description={description}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
          showCreateEvent={showCreateEvent}
          actions={actions}
        />
        <main className="flex-1 space-y-6 p-6 sm:p-8">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {loading && (
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              Đang đồng bộ dữ liệu vận hành…
            </div>
          )}
          {children}
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
