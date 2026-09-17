import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Mic2, Pencil, Trash2, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminApi, type AdminArtist } from "@/api/admin.api";
import { useAuth } from "@/context/AuthContext";
import type { ConfirmModalState } from "@/pages/admin/adminShared";
import {
  AdminPageShell,
  AdminConfirmModal,
} from "@/layouts/admin/HeaderAdmin";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "@/lib/toast";

const emptyForm = {
  name: "",
  stageName: "",
  bio: "",
  avatarUrl: "",
};

function ArtistAvatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeCls =
    size === "lg" ? "size-16" : size === "sm" ? "size-8" : "size-12";
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeCls} shrink-0 rounded-full object-cover border border-border`}
      />
    );
  }
  return (
    <div
      className={`${sizeCls} shrink-0 rounded-full bg-zinc-400/80 border border-border`}
      title={name}
      aria-hidden
    />
  );
}

export default function ArtistPage() {
  const { isAuthenticated } = useAuth();

  const [artists, setArtists] = useState<AdminArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<ConfirmModalState | null>(null);

  const refresh = useCallback(async (q?: string) => {
    setError(null);
    try {
      const res = await adminApi.listArtists(q);
      setArtists(res.data.artists);
      setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được danh sách nghệ sĩ",
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
    void refresh(query);
  }, [isAuthenticated, refresh, query]);

  const filteredHint = useMemo(
    () => (query ? `Kết quả cho “${query}”` : "Tất cả nghệ sĩ"),
    [query],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (a: AdminArtist) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      stageName: a.stageName ?? "",
      bio: a.bio ?? "",
      avatarUrl: a.avatarUrl ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nhập tên nghệ sĩ");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        stageName: form.stageName.trim() || undefined,
        bio: form.bio.trim() || undefined,
        avatarUrl: form.avatarUrl.trim() || undefined,
      };
      if (editingId != null) {
        await adminApi.updateArtist(editingId, {
          ...payload,
          avatarUrl: form.avatarUrl.trim() || null,
        });
        toast.success(`Đã cập nhật nghệ sĩ #${editingId}`);
      } else {
        await adminApi.createArtist(payload);
        toast.success("Đã tạo nghệ sĩ");
      }
      resetForm();
      await refresh(query);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : editingId != null
            ? "Cập nhật thất bại"
            : "Tạo nghệ sĩ thất bại",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = (a: AdminArtist) => {
    setModal({
      kind: "confirm",
      title: "Xóa nghệ sĩ",
      description: `Xóa “#${a.id} ${a.name}”? Không thể xóa nếu đang gắn sự kiện.`,
      confirmLabel: "Xóa",
      confirmVariant: "destructive",
      onConfirm: async () => {
        await adminApi.deleteArtist(a.id);
        if (editingId === a.id) resetForm();
        toast.success(`Đã xóa nghệ sĩ #${a.id}`);
        setModal(null);
        await refresh(query);
      },
    });
  };

  return (
    <AdminPageShell
      title="Nghệ sĩ"
      description="Quản lý line-up — thêm / sửa / xóa / tìm kiếm"
      lastUpdated={lastUpdated}
      loading={loading}
      error={error}
      onRefresh={() => void refresh(query)}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>
                  {editingId != null
                    ? `Sửa nghệ sĩ #${editingId}`
                    : "Tạo nghệ sĩ"}
                </CardTitle>
                <CardDescription>
                  Không có ảnh → hiển thị nền xám trên danh sách và form sự kiện.
                </CardDescription>
              </div>
              {editingId != null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    resetForm();
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <ImageUpload
                  folder="artists"
                  variant="avatar"
                  label="Upload ảnh"
                  value={form.avatarUrl}
                  onChange={(url) =>
                    setForm((f) => ({ ...f, avatarUrl: url }))
                  }
                  onClear={() => setForm((f) => ({ ...f, avatarUrl: "" }))}
                />
                <div className="grid flex-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tên nghệ sĩ *
                    </label>
                    <Input
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="VD: Sơn Tùng M-TP"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Nghệ danh
                    </label>
                    <Input
                      value={form.stageName}
                      onChange={(e) =>
                        setForm({ ...form, stageName: e.target.value })
                      }
                      placeholder="Stage name"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tiểu sử
                    </label>
                    <textarea
                      value={form.bio}
                      onChange={(e) =>
                        setForm({ ...form, bio: e.target.value })
                      }
                      rows={3}
                      className="w-full rounded-lg border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={busy}>
                <Plus className="size-3.5" />
                {busy
                  ? "Đang lưu…"
                  : editingId != null
                    ? "Cập nhật"
                    : "Tạo nghệ sĩ"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredHint} · {artists.length} nghệ sĩ
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search.trim());
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên / nghệ danh…"
                className="w-64 pl-8"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Tìm
            </Button>
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setQuery("");
                }}
              >
                Xóa lọc
              </Button>
            )}
          </form>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((a) => (
            <Card key={a.id} className="gap-0 overflow-hidden p-0">
              <CardContent className="flex items-start gap-3 p-4">
                <ArtistAvatar name={a.name} avatarUrl={a.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium leading-snug">{a.name}</p>
                  {a.stageName && (
                    <p className="truncate text-xs text-muted-foreground">
                      {a.stageName}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {a.eventCount ?? 0} sự kiện
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => startEdit(a)}
                    >
                      <Pencil className="size-3" />
                      Sửa
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="xs"
                      onClick={() => handleDelete(a)}
                    >
                      <Trash2 className="size-3" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {!artists.length && (
            <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
              <Mic2 className="mr-1.5 inline size-4 opacity-60" />
              Chưa có nghệ sĩ{query ? " khớp tìm kiếm" : ""}.
            </p>
          )}
        </div>
      </div>

      <AdminConfirmModal modal={modal} setModal={setModal} />
    </AdminPageShell>
  );
}
