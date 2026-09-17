import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, Armchair, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { adminApi, type AdminPlace } from "@/api/admin.api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "cn";
import type { ConfirmModalState } from "@/pages/admin/adminShared";
import {
  AdminPageShell,
  AdminConfirmModal,
} from "@/layouts/admin/HeaderAdmin";

type ZoneDraft = {
  key: string;
  id?: number;
  name: string;
  hasSeats: boolean;
};

const emptyPlace = { name: "", address: "", city: "Hà Nội" };

const defaultZones = (): ZoneDraft[] => [
  { key: `pz-${Date.now()}-1`, name: "VIP", hasSeats: true },
  { key: `pz-${Date.now()}-2`, name: "Standard", hasSeats: true },
  { key: `pz-${Date.now()}-3`, name: "Standing / GA", hasSeats: false },
];

export default function PlacePage() {
  const { isAuthenticated } = useAuth();

  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyPlace);
  const [zoneDrafts, setZoneDrafts] = useState<ZoneDraft[]>(defaultZones);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [modal, setModal] = useState<ConfirmModalState | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const pl = await adminApi.listPlaces();
      setPlaces(pl.data.places);
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
    setForm(emptyPlace);
    setZoneDrafts(defaultZones());
  };

  const startEdit = (place: AdminPlace) => {
    setEditingId(place.id);
    setForm({
      name: place.name,
      address: place.address,
      city: place.city,
    });
    setZoneDrafts(
      (place.zones ?? []).length
        ? place.zones.map((z) => ({
            key: `z-${z.id}`,
            id: z.id,
            name: z.name,
            hasSeats: z.hasSeats,
          }))
        : defaultZones(),
    );
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!form.name.trim()) {
      setMsg("Nhập tên địa điểm");
      return;
    }
    const zones = zoneDrafts
      .map((z) => ({
        ...(z.id ? { id: z.id } : {}),
        name: z.name.trim(),
        hasSeats: z.hasSeats,
      }))
      .filter((z) => z.name);
    if (!zones.length) {
      setMsg("Cần ít nhất 1 khu vực (zone)");
      return;
    }
    const names = zones.map((z) => z.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      setMsg("Tên khu vực không được trùng");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || form.name.trim(),
        city: form.city.trim() || "Hà Nội",
        zones,
      };
      if (editingId != null) {
        await adminApi.updatePlace(editingId, payload);
        setMsg(`Đã cập nhật địa điểm #${editingId}`);
      } else {
        await adminApi.createPlace(payload);
        setMsg("Đã tạo địa điểm");
      }
      resetForm();
      await refresh();
    } catch (err) {
      setMsg(
        err instanceof Error
          ? err.message
          : editingId != null
            ? "Cập nhật địa điểm thất bại"
            : "Tạo địa điểm thất bại",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePlace = (place: AdminPlace) => {
    const eventCount = place._count?.events ?? 0;
    if (eventCount > 0) {
      setModal({
        kind: "alert",
        title: "Không thể xóa",
        description: `Địa điểm "${place.name}" đang gắn ${eventCount} sự kiện. Hãy xóa hoặc đổi sự kiện trước.`,
      });
      return;
    }
    setModal({
      kind: "confirm",
      title: "Xóa địa điểm",
      description: `Xóa "#${place.id} ${place.name}" và toàn bộ zone/ghế liên quan? Hành động này không hoàn tác.`,
      confirmLabel: "Xóa",
      confirmVariant: "destructive",
      onConfirm: async () => {
        await adminApi.deletePlace(place.id);
        if (editingId === place.id) resetForm();
        setMsg(`Đã xóa địa điểm #${place.id}`);
        setModal(null);
        await refresh();
      },
    });
  };

  return (
    <AdminPageShell
      title="Địa điểm (Place)"
      description="Tạo / sửa Place và zone vật lý để tái sử dụng cho nhiều sự kiện"
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
                    ? `Sửa địa điểm #${editingId}`
                    : "Tạo địa điểm (Place)"}
                </CardTitle>
                <CardDescription>
                  {editingId != null
                    ? "Cập nhật thông tin và khu vực. Zone đang gắn sự kiện không thể xóa."
                    : "Tạo Place kèm zone vật lý mặc định. Sau đó gắn vào sự kiện."}
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
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tên địa điểm *
                  </label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="SVĐ Mỹ Đình"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Thành phố
                  </label>
                  <Input
                    value={form.city}
                    onChange={(e) =>
                      setForm({ ...form, city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Địa chỉ
                  </label>
                  <Input
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="Lê Đức Thọ, Nam Từ Liêm"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Khu vực (Zone)</p>
                    <p className="text-xs text-muted-foreground">
                      Mỗi zone: tên + loại ngồi / đứng
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setZoneDrafts((rows) => [
                        ...rows,
                        {
                          key: `pz-${Date.now()}`,
                          name: "",
                          hasSeats: true,
                        },
                      ])
                    }
                  >
                    <Plus className="size-3.5" />
                    Thêm khu vực
                  </Button>
                </div>

                <div className="space-y-2">
                  {zoneDrafts.map((z, idx) => (
                    <div
                      key={z.key}
                      className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <label className="text-[11px] text-muted-foreground">
                          Title · Khu #{idx + 1}
                          {z.id ? ` · id ${z.id}` : ""}
                        </label>
                        <Input
                          required
                          value={z.name}
                          onChange={(e) =>
                            setZoneDrafts((rows) =>
                              rows.map((r) =>
                                r.key === z.key
                                  ? { ...r, name: e.target.value }
                                  : r,
                              ),
                            )
                          }
                          placeholder="VIP / CAT 1 / Standing…"
                        />
                      </div>

                      <div className="space-y-1 sm:w-44">
                        <label className="text-[11px] text-muted-foreground">
                          Loại Zone
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setZoneDrafts((rows) =>
                              rows.map((r) =>
                                r.key === z.key
                                  ? { ...r, hasSeats: !r.hasSeats }
                                  : r,
                              ),
                            )
                          }
                          className={cn(
                            "flex h-9 w-full items-center justify-center gap-2 rounded-lg border text-xs font-medium transition-colors",
                            z.hasSeats
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border bg-input/30 text-muted-foreground",
                          )}
                          title="Bấm để đổi ngồi ↔ đứng"
                        >
                          {z.hasSeats ? (
                            <>
                              <Armchair className="size-3.5" />
                              Ngồi
                            </>
                          ) : (
                            <>
                              <Users className="size-3.5" />
                              Đứng
                            </>
                          )}
                          <span
                            className={cn(
                              "relative ml-1 h-5 w-9 rounded-full transition-colors",
                              z.hasSeats ? "bg-primary/40" : "bg-muted",
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 size-4 rounded-full bg-background transition-transform",
                                z.hasSeats ? "left-4" : "left-0.5",
                              )}
                            />
                          </span>
                        </button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="self-end text-muted-foreground hover:text-destructive sm:self-center"
                        disabled={zoneDrafts.length <= 1}
                        onClick={() =>
                          setZoneDrafts((rows) =>
                            rows.length <= 1
                              ? rows
                              : rows.filter((r) => r.key !== z.key),
                          )
                        }
                        title="Xóa khu vực"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
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
                      : "Tạo địa điểm"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {places.map((p) => (
            <Card
              key={p.id}
              className={cn(editingId === p.id && "ring-1 ring-primary/40")}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base">
                      #{p.id} {p.name}
                    </CardTitle>
                    <CardDescription>
                      {p.address}, {p.city}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                      title="Sửa địa điểm"
                      onClick={() => startEdit(p)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      title={
                        (p._count?.events ?? 0) > 0
                          ? "Không xóa được — đang có sự kiện"
                          : "Xóa địa điểm"
                      }
                      onClick={() => void handleDeletePlace(p)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="text-xs text-muted-foreground">
                  {p._count?.events ?? 0} sự kiện · {p.zones?.length ?? 0} zone
                </p>
                {(p.zones ?? []).map((z) => (
                  <div
                    key={z.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-1.5">
                      {z.hasSeats ? (
                        <Armchair className="size-3" />
                      ) : (
                        <Users className="size-3" />
                      )}
                      {z.name}
                    </span>
                    <span className="text-muted-foreground">
                      {z._count.seats} ghế DB
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AdminConfirmModal modal={modal} setModal={setModal} />
    </AdminPageShell>
  );
}
