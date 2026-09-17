import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  CalendarDays,
  MapPin,
  Armchair,
  Users,
  Building2,
  ImageIcon,
  Map,
  Pencil,
  Lock,
} from "lucide-react";
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
import {
  adminApi,
  type AdminEvent,
  type AdminEventEditPolicy,
  type AdminOrganizer,
  type AdminPlace,
} from "@/api/admin.api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "cn";
import {
  formatVND,
  rowLabelPreview,
  StatusBadge,
  type ConfirmModalState,
} from "@/pages/admin/adminShared";
import {
  AdminPageShell,
  AdminConfirmModal,
} from "@/layouts/admin/HeaderAdmin";
import { Modal } from "@/components/ui/modal";

function resolvePolicy(evt: AdminEvent): AdminEventEditPolicy {
  if (evt.editPolicy) return evt.editPolicy;
  const status = (
    evt.status === "active" || evt.status === "published"
      ? "open"
      : evt.status === "completed"
        ? "ended"
        : evt.status
  ) as AdminEventEditPolicy["status"];
  const hasBookings = (evt.soldTickets ?? 0) > 0;
  if (status === "ended") {
    return {
      status,
      hasBookings,
      canEditAll: false,
      canEditMarketing: false,
      canEditSensitive: false,
      canChangePlace: false,
      canChangePrice: false,
      canModifyZones: false,
      canAddZone: false,
      canDeleteEvent: false,
      canChangeStatus: false,
      reason: "Đã kết thúc — read-only.",
    };
  }
  if (status === "draft" || (status === "upcoming" && !hasBookings)) {
    return {
      status,
      hasBookings,
      canEditAll: true,
      canEditMarketing: true,
      canEditSensitive: true,
      canChangePlace: true,
      canChangePrice: true,
      canModifyZones: true,
      canAddZone: true,
      canDeleteEvent: true,
      canChangeStatus: true,
      reason: "Được sửa Full.",
    };
  }
  return {
    status,
    hasBookings,
    canEditAll: false,
    canEditMarketing: true,
    canEditSensitive: false,
    canChangePlace: false,
    canChangePrice: false,
    canModifyZones: false,
    canAddZone: true,
    canDeleteEvent: false,
    canChangeStatus: true,
    reason: "Chỉ sửa truyền thông; khóa địa điểm / zone / giá.",
  };
}

type ZoneDraft = {
  key: string;
  zoneId?: number;
  name: string;
  price: string;
  totalSeats: string;
  rowCount: string;
  hasSeats: boolean;
};

const DEFAULT_ZONES: ZoneDraft[] = [
  {
    key: "z1",
    name: "VIP",
    price: "3500000",
    totalSeats: "100",
    rowCount: "10",
    hasSeats: true,
  },
  {
    key: "z2",
    name: "Standard",
    price: "1500000",
    totalSeats: "500",
    rowCount: "25",
    hasSeats: true,
  },
  {
    key: "z3",
    name: "Standing / GA",
    price: "800000",
    totalSeats: "800",
    rowCount: "",
    hasSeats: false,
  },
];

export default function EventPage() {
  const { isAuthenticated } = useAuth();

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [organizers, setOrganizers] = useState<AdminOrganizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    city: "Hà Nội",
    address: "",
    date: "",
    organizerId: "",
    organizerName: "",
    logoUrl: "",
    bannerUrl: "",
    mapUrl: "",
    placeId: "",
  });
  const [zoneDrafts, setZoneDrafts] = useState<ZoneDraft[]>(DEFAULT_ZONES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [modal, setModal] = useState<ConfirmModalState | null>(null);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    organizerName: "",
    bannerUrl: "",
    mapUrl: "",
    logoUrl: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [ev, pl, org] = await Promise.all([
        adminApi.listEvents(),
        adminApi.listPlaces().catch(() => ({ data: { places: [] as AdminPlace[] } })),
        adminApi
          .listOrganizers()
          .catch(() => ({ data: { organizers: [] as AdminOrganizer[] } })),
      ]);
      setEvents(ev.data.events);
      setPlaces(pl.data.places);
      setOrganizers(org.data.organizers);
      setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu admin");
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

  const selectedPlace = useMemo(
    () => places.find((p) => String(p.id) === newEvent.placeId),
    [places, newEvent.placeId],
  );

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);

    if (!newEvent.title.trim()) {
      setFormMessage({ type: "err", text: "Vui lòng nhập tên sự kiện" });
      return;
    }
    if (!newEvent.placeId && !newEvent.location.trim()) {
      setFormMessage({
        type: "err",
        text: "Chọn địa điểm có sẵn hoặc nhập địa điểm mới",
      });
      return;
    }
    if (!zoneDrafts.length) {
      setFormMessage({ type: "err", text: "Cần ít nhất 1 khu vực / hạng vé" });
      return;
    }
    for (const z of zoneDrafts) {
      if (!z.name.trim() || !(Number(z.price) > 0) || !(Number(z.totalSeats) >= 1)) {
        setFormMessage({
          type: "err",
          text: `Khu "${z.name || "?"}" cần tên, giá > 0 và số lượng ≥ 1`,
        });
        return;
      }
      if (z.hasSeats) {
        const rows = Number(z.rowCount);
        if (!Number.isInteger(rows) || rows < 1) {
          setFormMessage({
            type: "err",
            text: `Khu "${z.name}" (có ghế) cần nhập số hàng ≥ 1`,
          });
          return;
        }
        if (rows > Number(z.totalSeats)) {
          setFormMessage({
            type: "err",
            text: `Khu "${z.name}": số hàng không được lớn hơn tổng ghế`,
          });
          return;
        }
      }
    }

    const normalizeUrl = (raw: string) => {
      const v = raw.trim();
      if (!v) return undefined;
      if (/^https?:\/\//i.test(v)) return v;
      return `https://${v}`;
    };

    setIsSubmitting(true);
    try {
      const created = await adminApi.createEvent({
        title: newEvent.title.trim(),
        description: newEvent.description.trim() || undefined,
        organizerId: newEvent.organizerId
          ? Number(newEvent.organizerId)
          : undefined,
        organizerName: newEvent.organizerName.trim() || undefined,
        logoUrl: normalizeUrl(newEvent.logoUrl),
        bannerUrl: normalizeUrl(newEvent.bannerUrl),
        mapUrl: normalizeUrl(newEvent.mapUrl),
        status: "draft",
        ...(newEvent.placeId
          ? { placeId: Number(newEvent.placeId) }
          : {
              place: {
                name: newEvent.location.trim(),
                address: (newEvent.address || newEvent.location).trim(),
                city: (newEvent.city || "Hà Nội").trim(),
              },
            }),
        startTime: newEvent.date
          ? new Date(`${newEvent.date}T18:00:00`).toISOString()
          : undefined,
        endTime: newEvent.date
          ? new Date(`${newEvent.date}T23:00:00`).toISOString()
          : undefined,
        zones: zoneDrafts.map((z) => ({
          ...(z.zoneId ? { zoneId: z.zoneId } : {}),
          name: z.name.trim(),
          price: Number(z.price),
          totalSeats: Number(z.totalSeats),
          hasSeats: z.hasSeats,
          ...(z.hasSeats ? { rowCount: Number(z.rowCount) } : {}),
          generateSeats: z.hasSeats,
        })),
      });

      setNewEvent({
        title: "",
        description: "",
        location: "",
        city: "Hà Nội",
        address: "",
        date: "",
        organizerId: "",
        organizerName: "",
        logoUrl: "",
        bannerUrl: "",
        mapUrl: "",
        placeId: "",
      });
      setZoneDrafts(
        DEFAULT_ZONES.map((z) => ({ ...z, key: `${z.key}-${Date.now()}` })),
      );
      setFormMessage({
        type: "ok",
        text: `Đã tạo sự kiện #${created.data.event.id} — ${created.data.event.title}`,
      });
      await refresh();
    } catch (err) {
      setFormMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Tạo sự kiện thất bại",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateZoneDraft = (key: string, patch: Partial<ZoneDraft>) => {
    setZoneDrafts((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  };

  const addZoneDraft = () => {
    setZoneDrafts((rows) => [
      ...rows,
      {
        key: `z-${Date.now()}`,
        name: "",
        price: "1000000",
        totalSeats: "100",
        rowCount: "10",
        hasSeats: true,
      },
    ]);
  };

  const removeZoneDraft = (key: string) => {
    setZoneDrafts((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.key !== key)));
  };

  const applyPlaceZones = (placeId: string) => {
    setNewEvent((s) => ({ ...s, placeId }));
    const place = places.find((p) => String(p.id) === placeId);
    if (!place?.zones.length) return;
    setZoneDrafts(
      place.zones.map((z, i) => ({
        key: `pz-${z.id}-${i}`,
        zoneId: z.id,
        name: z.name,
        price: "1500000",
        totalSeats: String(Math.max(z._count.seats || 50, 50)),
        rowCount: z.hasSeats ? "10" : "",
        hasSeats: z.hasSeats,
      })),
    );
  };

  const openEdit = (evt: AdminEvent) => {
    const policy = resolvePolicy(evt);
    if (!policy.canEditMarketing && !policy.canEditAll) {
      setModal({
        kind: "alert",
        title: "Không thể sửa",
        description: policy.reason,
      });
      return;
    }
    setEditing(evt);
    setEditForm({
      title: evt.title || "",
      description: evt.description || "",
      organizerName: evt.organizerName || "",
      bannerUrl: evt.bannerUrl || "",
      mapUrl: evt.mapUrl || "",
      logoUrl: evt.logoUrl || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setEditSaving(true);
    try {
      await adminApi.updateEvent(editing.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        organizerName: editForm.organizerName.trim(),
        bannerUrl: editForm.bannerUrl.trim(),
        mapUrl: editForm.mapUrl.trim(),
        logoUrl: editForm.logoUrl.trim(),
      });
      setEditing(null);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setEditSaving(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await adminApi.updateEvent(id, { status });
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cập nhật thất bại");
    }
  };

  const handleDeleteEvent = (id: number, title: string, policy: AdminEventEditPolicy) => {
    if (!policy.canDeleteEvent) {
      setModal({
        kind: "alert",
        title: "Không thể xóa",
        description: policy.reason,
      });
      return;
    }
    setModal({
      kind: "confirm",
      title: "Xóa sự kiện",
      description: `Xóa sự kiện "${title}"? Hành động này không hoàn tác.`,
      confirmLabel: "Xóa",
      confirmVariant: "destructive",
      onConfirm: async () => {
        await adminApi.deleteEvent(id);
        setModal(null);
        await refresh();
      },
    });
  };

  return (
    <AdminPageShell
      title="Sự kiện"
      description="Gắn Place + Nhà cung cấp + hạng vé để mở bán"
      lastUpdated={lastUpdated}
      loading={loading}
      error={error}
      onRefresh={() => void refresh()}
      showCreateEvent={false}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Tạo sự kiện mới</CardTitle>
            <CardDescription>
              Place → Zone (khu vật lý) → EventZone (giá & cung). Có ghế thì
              hệ thống sinh sơ đồ ghế.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form
              onSubmit={(e) => void handleCreateEvent(e)}
              noValidate
              className="space-y-6"
            >
              {formMessage && (
                <div
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm",
                    formMessage.type === "ok"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-destructive/30 bg-destructive/10 text-destructive",
                  )}
                >
                  {formMessage.text}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tên sự kiện *
                  </label>
                  <Input
                    required
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                    placeholder="Concert Solana Live 2026"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Mô tả sự kiện
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        description: e.target.value,
                      })
                    }
                    placeholder="Giới thiệu ngắn về chương trình, nghệ sĩ, lịch trình…"
                    rows={4}
                    className="w-full resize-y rounded-lg border border-input bg-input/30 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Địa điểm có sẵn (tái dùng Zone)
                  </label>
                  <select
                    value={newEvent.placeId}
                    onChange={(e) => applyPlaceZones(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">— Tạo địa điểm mới bên dưới —</option>
                    {places.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} {p.name} ({p.city}) · {p.zones.length} khu
                      </option>
                    ))}
                  </select>
                  {selectedPlace && (
                    <p className="text-[11px] text-muted-foreground">
                      Đã nạp {selectedPlace.zones.length} zone từ địa điểm.
                      Chỉ cần chỉnh giá / cung cho sự kiện này.
                    </p>
                  )}
                </div>

                {!newEvent.placeId && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Tên địa điểm mới *
                      </label>
                      <Input
                        value={newEvent.location}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            location: e.target.value,
                          })
                        }
                        placeholder="SVĐ Mỹ Đình"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Thành phố
                      </label>
                      <Input
                        value={newEvent.city}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, city: e.target.value })
                        }
                        placeholder="Hà Nội"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Địa chỉ
                      </label>
                      <Input
                        value={newEvent.address}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            address: e.target.value,
                          })
                        }
                        placeholder="Đường Lê Đức Thọ, Nam Từ Liêm"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Ngày diễn ra
                  </label>
                  <Input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* ── Nhà cung cấp / tổ chức ─────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Nhà cung cấp</p>
                    <p className="text-xs text-muted-foreground">
                      Chọn từ danh sách hoặc nhập tên hiển thị thủ công
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Chọn nhà cung cấp
                    </label>
                    <select
                      value={newEvent.organizerId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const org = organizers.find(
                          (o) => String(o.id) === id,
                        );
                        setNewEvent({
                          ...newEvent,
                          organizerId: id,
                          organizerName: org?.fullName || newEvent.organizerName,
                          logoUrl: org?.avatarUrl || newEvent.logoUrl,
                        });
                      }}
                      className="h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="">— Dùng tài khoản admin hiện tại —</option>
                      {organizers.map((o) => (
                        <option key={o.id} value={o.id}>
                          #{o.id} {o.fullName} ({o.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tên hiển thị
                    </label>
                    <Input
                      value={newEvent.organizerName}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          organizerName: e.target.value,
                        })
                      }
                      placeholder="Vie Channel & Ban Tổ Chức"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      URL ảnh / logo
                    </label>
                    <Input
                      value={newEvent.logoUrl}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          logoUrl: e.target.value,
                        })
                      }
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  {newEvent.logoUrl.trim() && (
                    <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
                      <img
                        src={newEvent.logoUrl}
                        alt="Logo nhà tổ chức"
                        className="size-14 rounded-lg border border-border object-cover bg-background"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.opacity =
                            "0.3";
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {newEvent.organizerName || "Nhà tổ chức"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Preview ảnh logo
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* ── Ảnh poster & sơ đồ ─────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="size-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Hình ảnh sự kiện</p>
                    <p className="text-xs text-muted-foreground">
                      Poster bán vé và ảnh sơ đồ khán đài / chỗ ngồi
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <ImageIcon className="size-3" />
                      URL ảnh poster
                    </label>
                    <Input
                      value={newEvent.bannerUrl}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          bannerUrl: e.target.value,
                        })
                      }
                      placeholder="https://example.com/poster.jpg"
                    />
                    {newEvent.bannerUrl.trim() ? (
                      <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
                        <img
                          src={newEvent.bannerUrl}
                          alt="Poster preview"
                          className="h-36 w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.opacity =
                              "0.3";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-[11px] text-muted-foreground">
                        Preview poster
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Map className="size-3" />
                      URL ảnh sơ đồ
                    </label>
                    <Input
                      value={newEvent.mapUrl}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          mapUrl: e.target.value,
                        })
                      }
                      placeholder="https://example.com/seatmap.jpg"
                    />
                    {newEvent.mapUrl.trim() ? (
                      <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
                        <img
                          src={newEvent.mapUrl}
                          alt="Sơ đồ preview"
                          className="h-36 w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.opacity =
                              "0.3";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-[11px] text-muted-foreground">
                        Preview sơ đồ chỗ ngồi
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      Khu vực / hạng vé (Zone)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Có ghế: nhập số hàng (vd 200/10 → 10×20; 200/11 → 11×18
                      + 1 hàng 2 ghế). Đứng: không sinh ghế.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addZoneDraft}
                  >
                    <Plus className="size-3.5" />
                    Thêm khu
                  </Button>
                </div>

                <div className="space-y-3">
                  {zoneDrafts.map((z, idx) => (
                    <div
                      key={z.key}
                      className="rounded-xl border border-border bg-muted/20 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Khu #{idx + 1}
                          {z.zoneId ? ` · zoneId ${z.zoneId}` : ""}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeZoneDraft(z.key)}
                          disabled={zoneDrafts.length <= 1}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground">
                            Tên khu *
                          </label>
                          <Input
                            required
                            value={z.name}
                            onChange={(e) =>
                              updateZoneDraft(z.key, {
                                name: e.target.value,
                                zoneId: undefined,
                              })
                            }
                            placeholder="VIP / Standard / GA"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground">
                            Giá (VNĐ) *
                          </label>
                          <Input
                            type="number"
                            required
                            min={1}
                            value={z.price}
                            onChange={(e) =>
                              updateZoneDraft(z.key, {
                                price: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground">
                            Tổng ghế / cung *
                          </label>
                          <Input
                            type="number"
                            required
                            min={1}
                            value={z.totalSeats}
                            onChange={(e) =>
                              updateZoneDraft(z.key, {
                                totalSeats: e.target.value,
                              })
                            }
                          />
                        </div>
                        {z.hasSeats ? (
                          <div className="space-y-1">
                            <label className="text-[11px] text-muted-foreground">
                              Số hàng *
                            </label>
                            <Input
                              type="number"
                              required
                              min={1}
                              value={z.rowCount}
                              onChange={(e) =>
                                updateZoneDraft(z.key, {
                                  rowCount: e.target.value,
                                })
                              }
                              placeholder="vd: 10 → A..J"
                            />
                            {Number(z.rowCount) >= 1 &&
                              Number(z.totalSeats) >= 1 && (() => {
                                const total = Number(z.totalSeats);
                                const rowsReq = Math.min(
                                  Number(z.rowCount),
                                  total,
                                );
                                const base = Math.floor(total / rowsReq);
                                const rem = total % rowsReq;
                                const lastRow = rem > 0 ? rem : base;
                                const totalRows =
                                  rem > 0 ? rowsReq + 1 : rowsReq;
                                return (
                                  <p className="text-[10px] text-muted-foreground">
                                    {rem === 0
                                      ? `${rowsReq} hàng × ${base} ghế`
                                      : `${rowsReq} hàng × ${base} ghế + 1 hàng × ${lastRow} ghế (= ${totalRows} hàng)`}{" "}
                                    · A1…{rowLabelPreview(totalRows - 1)}
                                    {lastRow}
                                  </p>
                                );
                              })()}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-[11px] text-muted-foreground">
                              Số hàng
                            </label>
                            <div className="flex h-8 items-center rounded-lg border border-dashed border-border px-2.5 text-xs text-muted-foreground">
                              Không áp dụng (đứng)
                            </div>
                          </div>
                        )}
                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground">
                            Loại khu
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              updateZoneDraft(z.key, {
                                hasSeats: !z.hasSeats,
                                rowCount: !z.hasSeats
                                  ? z.rowCount || "10"
                                  : "",
                              })
                            }
                            className={cn(
                              "flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition-colors",
                              z.hasSeats
                                ? "border-primary/40 bg-primary/10 text-primary"
                                : "border-border bg-input/30 text-muted-foreground",
                            )}
                          >
                            {z.hasSeats ? (
                              <>
                                <Armchair className="size-3.5" />
                                Có ghế
                              </>
                            ) : (
                              <>
                                <Users className="size-3.5" />
                                Đứng / GA
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  <Plus className="size-3.5" />
                  {isSubmitting ? "Đang tạo…" : "Tạo sự kiện + zones"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {events.map((evt) => (
            <Card key={evt.id} className="gap-0 overflow-hidden p-0">
              <div className="relative h-36 overflow-hidden bg-muted">
                {evt.bannerUrl ? (
                  <img
                    src={evt.bannerUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <CalendarDays className="size-8 opacity-40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                  <StatusBadge status={evt.status} />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    #{evt.id}
                  </span>
                </div>
              </div>
              <CardContent className="space-y-3 p-4">
                <div>
                  <h3 className="font-medium leading-snug">{evt.title}</h3>
                  {evt.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {evt.description}
                    </p>
                  )}
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    {evt.place?.name ?? "—"}
                    {evt.place?.city ? `, ${evt.place.city}` : ""}
                  </p>
                  {(evt.organizerName || evt.organizer || evt.logoUrl) && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {evt.logoUrl ? (
                        <img
                          src={evt.logoUrl}
                          alt=""
                          className="size-4 rounded object-cover border border-border"
                        />
                      ) : (
                        <Building2 className="size-3.5 shrink-0" />
                      )}
                      <span className="truncate">
                        {evt.organizerName || evt.organizer}
                      </span>
                    </p>
                  )}
                </div>
                {(evt.mapUrl || evt.logoUrl) && (
                  <div className="flex gap-2">
                    {evt.mapUrl && (
                      <div className="relative h-14 flex-1 overflow-hidden rounded-lg border border-border bg-muted/30">
                        <img
                          src={evt.mapUrl}
                          alt="Sơ đồ"
                          className="size-full object-cover"
                        />
                        <span className="absolute bottom-0.5 left-1 rounded bg-black/60 px-1 text-[9px] text-white">
                          Sơ đồ
                        </span>
                      </div>
                    )}
                    {evt.bannerUrl && evt.mapUrl && (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30">
                        <img
                          src={evt.logoUrl || evt.bannerUrl}
                          alt="Logo"
                          className="size-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-1 text-sm">
                  {evt.zones.map((z) => (
                    <div
                      key={z.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        {z.hasSeats ? (
                          <Armchair className="size-3" />
                        ) : (
                          <Users className="size-3" />
                        )}
                        {z.name}
                      </span>
                      <span className="shrink-0 text-right">
                        {formatVND(z.price)} · {z.soldTickets}/{z.totalSeats}
                      </span>
                    </div>
                  ))}
                </div>
                {(() => {
                  const policy = resolvePolicy(evt);
                  return (
                    <>
                      <p className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
                        {!policy.canEditSensitive && (
                          <Lock className="mt-0.5 size-3 shrink-0" />
                        )}
                        {policy.reason}
                      </p>
                      <Separator />
                      <div className="flex items-center gap-2">
                        <select
                          value={
                            evt.status === "active" || evt.status === "published"
                              ? "open"
                              : evt.status
                          }
                          disabled={!policy.canChangeStatus}
                          onChange={(e) =>
                            void handleStatusChange(evt.id, e.target.value)
                          }
                          className="h-8 flex-1 rounded-lg border border-input bg-input/30 px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="draft">Nháp</option>
                          <option value="upcoming">Sắp diễn ra</option>
                          <option value="open">Đang mở bán</option>
                          <option value="ended">Đã kết thúc</option>
                        </select>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          disabled={!policy.canEditMarketing}
                          title={
                            policy.canEditMarketing
                              ? "Sửa thông tin truyền thông"
                              : policy.reason
                          }
                          onClick={() => openEdit(evt)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          disabled={!policy.canDeleteEvent}
                          title={
                            policy.canDeleteEvent
                              ? "Xóa sự kiện"
                              : policy.reason
                          }
                          onClick={() =>
                            handleDeleteEvent(evt.id, evt.title, policy)
                          }
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
          {!events.length && (
            <p className="text-sm text-muted-foreground md:col-span-2">
              Chưa có sự kiện nào trong database.
            </p>
          )}
        </div>
      </div>

      <Modal
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="Sửa thông tin sự kiện"
        description={
          editing
            ? resolvePolicy(editing).canEditSensitive
              ? "Nháp / chưa bán — được sửa truyền thông (địa điểm & zone vẫn tạo lại bằng flow riêng)."
              : "Chỉ sửa truyền thông & hiển thị. Địa điểm, zone, giá bị khóa."
            : undefined
        }
        size="lg"
        confirmLabel="Lưu"
        confirmLoading={editSaving}
        onConfirm={() => void handleSaveEdit()}
      >
        {editing && (
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Tiêu đề</label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Mô tả</label>
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={4}
                className="w-full rounded-lg border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Nhà tổ chức (hiển thị)</label>
              <Input
                value={editForm.organizerName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, organizerName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Banner URL</label>
              <Input
                value={editForm.bannerUrl}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, bannerUrl: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Map URL</label>
              <Input
                value={editForm.mapUrl}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, mapUrl: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Logo URL</label>
              <Input
                value={editForm.logoUrl}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, logoUrl: e.target.value }))
                }
              />
            </div>
            {!resolvePolicy(editing).canEditSensitive && (
              <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                Đã khóa: địa điểm, cấu trúc zone/ghế, giá vé gốc.
              </p>
            )}
          </div>
        )}
      </Modal>

      <AdminConfirmModal modal={modal} setModal={setModal} />
    </AdminPageShell>
  );
}
