import { useCallback, useEffect, useState } from "react";
import { Plus, Building2, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminApi, type AdminOrganizer } from "@/api/admin.api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "cn";
import type { ConfirmModalState } from "@/pages/admin/adminShared";
import {
  AdminPageShell,
  AdminConfirmModal,
} from "@/layouts/admin/HeaderAdmin";

const emptyForm = { fullName: "", email: "", avatarUrl: "" };

export default function OrganizerPage() {
  const { isAuthenticated } = useAuth();

  const [organizers, setOrganizers] = useState<AdminOrganizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [modal, setModal] = useState<ConfirmModalState | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const org = await adminApi.listOrganizers();
      setOrganizers(org.data.organizers);
      setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được dữ liệu admin",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh();
    const id = window.setInterval(() => void refresh(), 20000);
    return () => window.clearInterval(id);
  }, [isAuthenticated, refresh]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (o: AdminOrganizer) => {
    setEditingId(o.id);
    setForm({
      fullName: o.fullName,
      email: o.email,
      avatarUrl: o.avatarUrl ?? "",
    });
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!form.fullName.trim() || !form.email.trim()) {
      setMsg("Nhập tên và email nhà cung cấp");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        avatarUrl: form.avatarUrl.trim() || undefined,
      };
      if (editingId != null) {
        await adminApi.updateOrganizer(editingId, payload);
        setMsg(`Đã cập nhật nhà cung cấp #${editingId}`);
      } else {
        await adminApi.createOrganizer(payload);
        setMsg("Đã tạo nhà cung cấp");
      }
      resetForm();
      await refresh();
    } catch (err) {
      setMsg(
        err instanceof Error
          ? err.message
          : editingId != null
            ? "Cập nhật thất bại"
            : "Tạo nhà cung cấp thất bại",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = (o: AdminOrganizer) => {
    if (o.role === "admin") {
      setModal({
        kind: "alert",
        title: "Không thể xóa",
        description: "Không xóa được tài khoản admin hệ thống.",
      });
      return;
    }
    setModal({
      kind: "confirm",
      title: "Xóa nhà cung cấp",
      description: `Xóa "#${o.id} ${o.fullName}" (${o.email})? Không thể xóa nếu đang gắn sự kiện.`,
      confirmLabel: "Xóa",
      confirmVariant: "destructive",
      onConfirm: async () => {
        await adminApi.deleteOrganizer(o.id);
        if (editingId === o.id) resetForm();
        setMsg(`Đã xóa nhà cung cấp #${o.id}`);
        setModal(null);
        await refresh();
      },
    });
  };

  return (
    <AdminPageShell
      title="Nhà cung cấp"
      description="Ban tổ chức / nhà cung cấp sự kiện (User role organizer)"
      lastUpdated={lastUpdated}
      loading={loading}
      error={error}
      onRefresh={() => void refresh()}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>
                  {editingId != null
                    ? `Sửa nhà cung cấp #${editingId}`
                    : "Tạo nhà cung cấp"}
                </CardTitle>
                <CardDescription>
                  {editingId != null
                    ? "Cập nhật tên, email và logo."
                    : "Lưu thành User role organizer, dùng khi tạo sự kiện."}
                </CardDescription>
              </div>
              {editingId != null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setMsg(null);
                  }}
                >
                  <X className="size-3.5" />
                  Hủy sửa
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <form
              onSubmit={(e) => void handleSubmit(e)}
              className="space-y-4"
            >
              {msg && (
                <p className="text-sm text-muted-foreground">{msg}</p>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tên nhà cung cấp *
                  </label>
                  <Input
                    required
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    placeholder="Vie Channel"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Email *
                  </label>
                  <Input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="btc@example.com"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    URL logo
                  </label>
                  <Input
                    value={form.avatarUrl}
                    onChange={(e) =>
                      setForm({ ...form, avatarUrl: e.target.value })
                    }
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                {editingId != null && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setMsg(null);
                    }}
                  >
                    Hủy
                  </Button>
                )}
                <Button type="submit" disabled={busy}>
                  {editingId != null ? (
                    <Pencil className="size-3.5" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  {busy
                    ? "Đang lưu…"
                    : editingId != null
                      ? "Lưu thay đổi"
                      : "Tạo nhà cung cấp"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizers.map((o) => (
            <Card
              key={o.id}
              className={cn(editingId === o.id && "ring-1 ring-primary/40")}
            >
              <CardContent className="flex items-start gap-3 pt-5">
                {o.avatarUrl ? (
                  <img
                    src={o.avatarUrl}
                    alt=""
                    className="size-12 shrink-0 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Building2 className="size-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    #{o.id} {o.fullName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {o.email}
                  </p>
                  <Badge variant="secondary" className="mt-1 rounded-md">
                    {o.role}
                  </Badge>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground"
                    title="Sửa"
                    onClick={() => startEdit(o)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    title={
                      o.role === "admin"
                        ? "Không xóa được admin"
                        : "Xóa nhà cung cấp"
                    }
                    onClick={() => void handleDelete(o)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AdminConfirmModal modal={modal} setModal={setModal} />
    </AdminPageShell>
  );
}
