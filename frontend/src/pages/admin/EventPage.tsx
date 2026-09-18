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
  Mic2,
  X,
  Star,
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
  type AdminArtist,
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
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "@/lib/toast";

function resolvePolicy(evt: AdminEvent): AdminEventEditPolicy {
  const status = (
    evt.status === "active" || evt.status === "published"
      ? "open"
      : evt.status === "completed" || evt.status === "finished"
        ? "ended"
        : evt.status
  ) as AdminEventEditPolicy["status"];
  const hasBookings = (evt.soldTickets ?? 0) > 0;
  const fallback: AdminEventEditPolicy =
    status === "ended"
      ? {
          status,
          hasBookings,
          canEditAll: false,
          canEditMarketing: false,
          canEditSensitive: false,
          canChangePlace: false,
          canChangePrice: false,
          canModifyZones: false,
          canAddZone: false,
          canDecreaseSeats: false,
          canDeleteEvent: false,
          canChangeStatus: false,
          reason: "Đã kết thúc — không được sửa gì.",
        }
      : status === "draft"
        ? {
            status,
            hasBookings,
            canEditAll: true,
            canEditMarketing: true,
            canEditSensitive: true,
            canChangePlace: true,
            canChangePrice: true,
            canModifyZones: true,
            canAddZone: true,
            canDecreaseSeats: true,
            canDeleteEvent: true,
            canChangeStatus: true,
            reason: "Nháp — được sửa Full.",
          }
        : status === "upcoming"
          ? {
              status,
              hasBookings,
              canEditAll: false,
              canEditMarketing: true,
              canEditSensitive: true,
              canChangePlace: false,
              canChangePrice: false,
              canModifyZones: true,
              canAddZone: true,
              canDecreaseSeats: true,
              canDeleteEvent: false,
              canChangeStatus: true,
              reason: "Sắp diễn ra — sửa Full trừ địa điểm và giá vé.",
            }
          : {
              status,
              hasBookings,
              canEditAll: false,
              canEditMarketing: true,
              canEditSensitive: true,
              canChangePlace: false,
              canChangePrice: false,
              canModifyZones: true,
              canAddZone: true,
              canDecreaseSeats: false,
              canDeleteEvent: false,
              canChangeStatus: true,
              reason:
                "Đang mở bán — sửa Full trừ địa điểm và giá; không giảm số ghế (được tăng).",
            };
  if (!evt.editPolicy) return fallback;
  return {
    ...fallback,
    ...evt.editPolicy,
    canDecreaseSeats:
      evt.editPolicy.canDecreaseSeats ?? fallback.canDecreaseSeats,
  };
}

type ZoneDraft = {
  key: string;
  eventZoneId?: number;
  zoneId?: number;
  name: string;
  price: string;
  totalSeats: string;
  rowCount: string;
  hasSeats: boolean;
  soldTickets?: number;
  originalSeats?: number;
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

/** Chuẩn hóa nhập ngày → dd/mm/yyyy (chấp nhận d/m/yyyy, dd-mm-yyyy…) */
function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Parse dd/mm/yyyy → Date local (00:00) hoặc null */
function parseDdMmYyyy(raw: string): Date | null {
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

/** Ghép dd/mm/yyyy + HH:mm → ISO string (local) */
function toIsoFromVn(dateStr: string, timeStr: string): string | null {
  const d = parseDdMmYyyy(dateStr);
  if (!d) return null;
  const tm = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!tm) return null;
  const hh = Number(tm[1]);
  const mm = Number(tm[2]);
  if (hh > 23 || mm > 59) return null;
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

function formatScheduleLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function partsFromIso(iso?: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "18:00" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "18:00" };
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return { date: `${dd}/${mm}/${yyyy}`, time: `${hh}:${mi}` };
}

export default function EventPage() {
  const { isAuthenticated, staffRole, user } = useAuth();

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [organizers, setOrganizers] = useState<AdminOrganizer[]>([]);
  const [artists, setArtists] = useState<AdminArtist[]>([]);
  const [selectedArtistIds, setSelectedArtistIds] = useState<number[]>([]);
  const [artistSearch, setArtistSearch] = useState("");
  const [quickArtistOpen, setQuickArtistOpen] = useState(false);
  const [quickArtist, setQuickArtist] = useState({ name: "", avatarUrl: "" });
  const [quickArtistBusy, setQuickArtistBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    city: "Hà Nội",
    address: "",
    startDate: "",
    startTime: "18:00",
    endDate: "",
    endTime: "23:00",
    organizerId: "",
    organizerName: "",
    logoUrl: "",
    bannerUrl: "",
    mapUrl: "",
    placeId: "",
    isFeatured: false,
  });
  const [zoneDrafts, setZoneDrafts] = useState<ZoneDraft[]>(DEFAULT_ZONES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<ConfirmModalState | null>(null);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    organizerName: "",
    bannerUrl: "",
    mapUrl: "",
    logoUrl: "",
    isFeatured: false,
    placeId: "",
    startDate: "",
    startTime: "18:00",
    endDate: "",
    endTime: "23:00",
  });
  const [editZones, setEditZones] = useState<ZoneDraft[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [ev, pl, org, art] = await Promise.all([
        adminApi.listEvents(),
        adminApi.listPlaces().catch(() => ({ data: { places: [] as AdminPlace[] } })),
        adminApi
          .listOrganizers()
          .catch(() => ({ data: { organizers: [] as AdminOrganizer[] } })),
        adminApi
          .listArtists()
          .catch(() => ({ data: { artists: [] as AdminArtist[] } })),
      ]);
      setEvents(
        staffRole === "organizer" && user?.id
          ? ev.data.events.filter((e) => e.organizerId === user.id)
          : ev.data.events,
      );
      setPlaces(pl.data.places);
      setOrganizers(org.data.organizers);
      setArtists(art.data.artists);
      setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu admin");
    } finally {
      setLoading(false);
    }
  }, [staffRole, user?.id]);

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

  const filteredArtists = useMemo(() => {
    const q = artistSearch.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.stageName ?? "").toLowerCase().includes(q),
    );
  }, [artists, artistSearch]);

  const toggleArtist = (id: number) => {
    setSelectedArtistIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleQuickCreateArtist = async () => {
    if (!quickArtist.name.trim()) {
      toast.error("Nhập tên nghệ sĩ");
      return;
    }
    setQuickArtistBusy(true);
    try {
      const res = await adminApi.createArtist({
        name: quickArtist.name.trim(),
        avatarUrl: quickArtist.avatarUrl.trim() || undefined,
      });
      const created = res.data.artist;
      setArtists((prev) => [created, ...prev]);
      setSelectedArtistIds((prev) =>
        prev.includes(created.id) ? prev : [...prev, created.id],
      );
      setQuickArtist({ name: "", avatarUrl: "" });
      setQuickArtistOpen(false);
      toast.success(`Đã thêm nghệ sĩ #${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tạo nghệ sĩ thất bại");
    } finally {
      setQuickArtistBusy(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEvent.title.trim()) {
      toast.error("Vui lòng nhập tên sự kiện");
      return;
    }
    if (!newEvent.placeId && !newEvent.location.trim()) {
      toast.error("Chọn địa điểm có sẵn hoặc nhập địa điểm mới");
      return;
    }
    if (!zoneDrafts.length) {
      toast.error("Cần ít nhất 1 khu vực / hạng vé");
      return;
    }

    const hasAnySchedule =
      newEvent.startDate.trim() ||
      newEvent.endDate.trim() ||
      newEvent.startTime.trim() ||
      newEvent.endTime.trim();

    let startIso: string | undefined;
    let endIso: string | undefined;

    if (hasAnySchedule) {
      if (!newEvent.startDate.trim() || !newEvent.startTime.trim()) {
        toast.error("Nhập ngày bắt đầu (dd/mm/yyyy) và giờ bắt đầu");
        return;
      }
      if (!newEvent.endDate.trim() || !newEvent.endTime.trim()) {
        toast.error("Nhập ngày kết thúc (dd/mm/yyyy) và giờ kết thúc");
        return;
      }
      startIso = toIsoFromVn(newEvent.startDate, newEvent.startTime) ?? undefined;
      endIso = toIsoFromVn(newEvent.endDate, newEvent.endTime) ?? undefined;
      if (!startIso) {
        toast.error("Ngày/giờ bắt đầu không hợp lệ (dd/mm/yyyy + HH:mm)");
        return;
      }
      if (!endIso) {
        toast.error("Ngày/giờ kết thúc không hợp lệ (dd/mm/yyyy + HH:mm)");
        return;
      }
      if (new Date(endIso) <= new Date(startIso)) {
        toast.error("Thời gian kết thúc phải sau thời gian bắt đầu");
        return;
      }
    }

    for (const z of zoneDrafts) {
      if (!z.name.trim() || !(Number(z.price) > 0) || !(Number(z.totalSeats) >= 1)) {
        toast.error(`Khu "${z.name || "?"}" cần tên, giá > 0 và số lượng ≥ 1`);
        return;
      }
      if (z.hasSeats) {
        const rows = Number(z.rowCount);
        if (!Number.isInteger(rows) || rows < 1) {
          toast.error(`Khu "${z.name}" (có ghế) cần nhập số hàng ≥ 1`);
          return;
        }
        if (rows > Number(z.totalSeats)) {
          toast.error(`Khu "${z.name}": số hàng không được lớn hơn tổng ghế`);
          return;
        }
      }
    }

    const normalizeUrl = (raw: string) => {
      const v = raw.trim();
      if (!v) return undefined;
      // Cloudinary / absolute URL giữ nguyên
      if (/^https?:\/\//i.test(v) || v.startsWith("data:")) return v;
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
        startTime: startIso,
        endTime: endIso,
        artistIds: selectedArtistIds,
        isFeatured: newEvent.isFeatured,
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
        startDate: "",
        startTime: "18:00",
        endDate: "",
        endTime: "23:00",
        organizerId: "",
        organizerName: "",
        logoUrl: "",
        bannerUrl: "",
        mapUrl: "",
        placeId: "",
        isFeatured: false,
      });
      setZoneDrafts(
        DEFAULT_ZONES.map((z) => ({ ...z, key: `${z.key}-${Date.now()}` })),
      );
      setSelectedArtistIds([]);
      setArtistSearch("");
      toast.success(
        `Đã tạo sự kiện #${created.data.event.id} — ${created.data.event.title}`,
      );
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tạo sự kiện thất bại");
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
      toast.error("Không thể sửa", policy.reason);
      return;
    }
    const start = partsFromIso(evt.schedules?.[0]?.startTime);
    const end = partsFromIso(evt.schedules?.[0]?.endTime);
    setEditing(evt);
    setEditForm({
      title: evt.title || "",
      description: evt.description || "",
      organizerName: evt.organizerName || "",
      bannerUrl: evt.bannerUrl || "",
      mapUrl: evt.mapUrl || "",
      logoUrl: evt.logoUrl || "",
      isFeatured: Boolean(evt.isFeatured),
      placeId: evt.place?.id ? String(evt.place.id) : "",
      startDate: start.date,
      startTime: start.time,
      endDate: end.date,
      endTime: end.time,
    });
    setEditZones(
      (evt.zones || []).map((z, i) => ({
        key: `ez-${z.id}-${i}`,
        eventZoneId: z.id,
        zoneId: z.zoneId,
        name: z.name,
        price: String(z.price ?? 0),
        totalSeats: String(z.totalSeats ?? 0),
        rowCount: z.hasSeats ? String(z.rowCount || 10) : "",
        hasSeats: Boolean(z.hasSeats),
        soldTickets: z.soldTickets ?? 0,
        originalSeats: z.totalSeats ?? 0,
      })),
    );
  };

  const updateEditZone = (key: string, patch: Partial<ZoneDraft>) => {
    setEditZones((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  };

  const addEditZone = () => {
    setEditZones((rows) => [
      ...rows,
      {
        key: `ez-new-${Date.now()}`,
        name: "",
        price: "1000000",
        totalSeats: "100",
        rowCount: "10",
        hasSeats: true,
        soldTickets: 0,
      },
    ]);
  };

  const removeEditZone = (key: string) => {
    const policy = editing ? resolvePolicy(editing) : null;
    setEditZones((rows) => {
      const target = rows.find((r) => r.key === key);
      if (!target) return rows;
      if ((target.soldTickets ?? 0) > 0) return rows;
      if (!policy?.canDecreaseSeats && target.eventZoneId) return rows;
      return rows.length <= 1 ? rows : rows.filter((r) => r.key !== key);
    });
  };

  const applyEditPlace = (placeId: string) => {
    setEditForm((f) => ({ ...f, placeId }));
    const place = places.find((p) => String(p.id) === placeId);
    if (!place?.zones.length) return;
    setEditZones((prev) =>
      place.zones.map((z, i) => {
        const matched = prev.find(
          (d) => d.name.trim().toLowerCase() === z.name.trim().toLowerCase(),
        );
        return {
          key: `pz-${z.id}-${i}`,
          zoneId: z.id,
          name: z.name,
          price: matched?.price || "1500000",
          totalSeats:
            matched?.totalSeats || String(Math.max(z._count.seats || 50, 50)),
          rowCount: z.hasSeats ? matched?.rowCount || "10" : "",
          hasSeats: z.hasSeats,
          soldTickets: 0,
        };
      }),
    );
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const policy = resolvePolicy(editing);
    const canPlaceZones =
      policy.canChangePlace || policy.canModifyZones || policy.canAddZone;
    if (canPlaceZones) {
      for (const z of editZones) {
        if (!z.name.trim()) {
          toast.error("Mỗi khu vực cần có tên");
          return;
        }
        if (!(Number(z.price) > 0) || !(Number(z.totalSeats) > 0)) {
          toast.error(`Khu "${z.name}": giá và số ghế phải > 0`);
          return;
        }
        if (
          !policy.canDecreaseSeats &&
          z.eventZoneId &&
          z.originalSeats != null &&
          Number(z.totalSeats) < z.originalSeats
        ) {
          toast.error(
            `Khu "${z.name}": không giảm số ghế (hiện ${z.originalSeats}, chỉ được tăng)`,
          );
          return;
        }
        if (z.hasSeats) {
          const rows = Number(z.rowCount);
          if (!Number.isInteger(rows) || rows < 1) {
            toast.error(`Khu "${z.name}" (có ghế) cần số hàng ≥ 1`);
            return;
          }
        }
      }
    }

    const startIso = toIsoFromVn(editForm.startDate, editForm.startTime);
    const endIso = toIsoFromVn(editForm.endDate, editForm.endTime);

    setEditSaving(true);
    try {
      await adminApi.updateEvent(editing.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        organizerName: editForm.organizerName.trim(),
        bannerUrl: editForm.bannerUrl.trim(),
        mapUrl: editForm.mapUrl.trim(),
        logoUrl: editForm.logoUrl.trim(),
        isFeatured: editForm.isFeatured,
        ...(policy.canChangePlace && editForm.placeId
          ? { placeId: Number(editForm.placeId) }
          : {}),
        ...(policy.canEditSensitive && startIso && endIso
          ? { startTime: startIso, endTime: endIso }
          : {}),
        ...(policy.canModifyZones || policy.canAddZone
          ? {
              zones: editZones.map((z) => ({
                ...(z.eventZoneId ? { eventZoneId: z.eventZoneId } : {}),
                ...(z.zoneId ? { zoneId: z.zoneId } : {}),
                name: z.name.trim(),
                price: Number(z.price),
                totalSeats: Number(z.totalSeats),
                hasSeats: z.hasSeats,
                ...(z.hasSeats ? { rowCount: Number(z.rowCount) } : {}),
                generateSeats: z.hasSeats,
              })),
            }
          : {}),
      });
      setEditing(null);
      toast.success("Đã cập nhật sự kiện");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setEditSaving(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await adminApi.updateEvent(id, { status });
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại");
    }
  };

  const handleDeleteEvent = (id: number, title: string, policy: AdminEventEditPolicy) => {
    if (!policy.canDeleteEvent) {
      toast.error("Không thể xóa", policy.reason);
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

                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNewEvent((e) => ({
                        ...e,
                        isFeatured: !e.isFeatured,
                      }))
                    }
                    className={cn(
                      "flex h-9 w-full items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors",
                      newEvent.isFeatured
                        ? "border-[#F97316]/50 bg-[#F97316]/10 text-[#F97316]"
                        : "border-border bg-input/30 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Star
                      className={cn(
                        "size-3.5",
                        newEvent.isFeatured && "fill-current",
                      )}
                    />
                    {newEvent.isFeatured
                      ? "Đang nổi bật trên trang chủ"
                      : "Đưa lên block Sự kiện nổi bật"}
                  </button>
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

                <div className="space-y-2 md:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Lịch diễn
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 rounded-xl border border-border bg-muted/20 p-3">
                      <p className="text-[11px] font-semibold text-foreground">
                        Bắt đầu
                      </p>
                      <div className="grid grid-cols-[1.4fr_1fr] gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">
                            Ngày (dd/mm/yyyy)
                          </label>
                          <Input
                            inputMode="numeric"
                            placeholder="28/09/2026"
                            value={newEvent.startDate}
                            onChange={(e) => {
                              const startDate = formatDateInput(e.target.value);
                              setNewEvent((prev) => ({
                                ...prev,
                                startDate,
                                // Gợi ý cùng ngày kết thúc nếu chưa nhập
                                endDate:
                                  prev.endDate.trim() || !startDate
                                    ? prev.endDate
                                    : startDate.length === 10
                                      ? startDate
                                      : prev.endDate,
                              }));
                            }}
                            maxLength={10}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">
                            Giờ
                          </label>
                          <Input
                            type="time"
                            value={newEvent.startTime}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                startTime: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5 rounded-xl border border-border bg-muted/20 p-3">
                      <p className="text-[11px] font-semibold text-foreground">
                        Kết thúc
                      </p>
                      <div className="grid grid-cols-[1.4fr_1fr] gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">
                            Ngày (dd/mm/yyyy)
                          </label>
                          <Input
                            inputMode="numeric"
                            placeholder="28/09/2026"
                            value={newEvent.endDate}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                endDate: formatDateInput(e.target.value),
                              })
                            }
                            maxLength={10}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">
                            Giờ
                          </label>
                          <Input
                            type="time"
                            value={newEvent.endTime}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                endTime: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
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
                      Logo nhà tổ chức
                    </label>
                    <ImageUpload
                      folder="organizers"
                      variant="square"
                      label="Upload logo Cloudinary"
                      value={newEvent.logoUrl}
                      onChange={(url) =>
                        setNewEvent((e) => ({ ...e, logoUrl: url }))
                      }
                      onClear={() =>
                        setNewEvent((e) => ({ ...e, logoUrl: "" }))
                      }
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

              {/* ── Nghệ sĩ / line-up ──────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mic2 className="size-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Nghệ sĩ</p>
                      <p className="text-xs text-muted-foreground">
                        Chọn line-up cho sự kiện · đã chọn{" "}
                        {selectedArtistIds.length}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickArtistOpen(true)}
                  >
                    <Plus className="size-3.5" />
                    Tạo nhanh
                  </Button>
                </div>
                <Input
                  value={artistSearch}
                  onChange={(e) => setArtistSearch(e.target.value)}
                  placeholder="Tìm nghệ sĩ…"
                />
                <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-xl border border-border bg-muted/20 p-3">
                  {filteredArtists.map((a) => {
                    const selected = selectedArtistIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleArtist(a.id)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs transition-colors",
                          selected
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        {a.avatarUrl ? (
                          <img
                            src={a.avatarUrl}
                            alt=""
                            className="size-6 rounded-full object-cover"
                          />
                        ) : (
                          <span className="size-6 rounded-full bg-zinc-400/80" />
                        )}
                        <span className="max-w-[140px] truncate font-medium">
                          {a.stageName || a.name}
                        </span>
                        {selected && (
                          <X className="size-3 opacity-70" />
                        )}
                      </button>
                    );
                  })}
                  {!filteredArtists.length && (
                    <p className="w-full text-xs text-muted-foreground">
                      Không có nghệ sĩ. Bấm “Tạo nhanh” để thêm.
                    </p>
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
                      Ảnh poster
                    </label>
                    <ImageUpload
                      folder="events"
                      variant="banner"
                      label="Upload poster Cloudinary"
                      value={newEvent.bannerUrl}
                      onChange={(url) =>
                        setNewEvent((e) => ({ ...e, bannerUrl: url }))
                      }
                      onClear={() =>
                        setNewEvent((e) => ({ ...e, bannerUrl: "" }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Map className="size-3" />
                      Ảnh sơ đồ chỗ ngồi
                    </label>
                    <ImageUpload
                      folder="maps"
                      variant="banner"
                      label="Upload sơ đồ Cloudinary"
                      value={newEvent.mapUrl}
                      onChange={(url) =>
                        setNewEvent((e) => ({ ...e, mapUrl: url }))
                      }
                      onClear={() =>
                        setNewEvent((e) => ({ ...e, mapUrl: "" }))
                      }
                    />
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
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={evt.status} />
                    {evt.isFeatured && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#F97316] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        <Star className="size-2.5 fill-current" />
                        Nổi bật
                      </span>
                    )}
                  </div>
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
                  {evt.schedules?.[0] && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {formatScheduleLabel(evt.schedules[0].startTime)}
                        {" → "}
                        {formatScheduleLabel(evt.schedules[0].endTime)}
                      </span>
                    </p>
                  )}
                  {(evt.artists?.length || evt.artist) && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mic2 className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {evt.artists?.length
                          ? evt.artists
                              .map((a) => a.stageName || a.name)
                              .join(", ")
                          : evt.artist}
                      </span>
                    </p>
                  )}
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
                        {!policy.canEditAll && (
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
                              ? "Sửa sự kiện"
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
        open={quickArtistOpen}
        onOpenChange={setQuickArtistOpen}
        title="Tạo nghệ sĩ nhanh"
        description="Điền tên và upload ảnh (không bắt buộc). Không ảnh → nền xám."
        size="md"
        confirmLabel="Tạo & chọn"
        confirmLoading={quickArtistBusy}
        onConfirm={() => void handleQuickCreateArtist()}
      >
        <div className="space-y-4">
          <ImageUpload
            folder="artists"
            variant="avatar"
            label="Upload ảnh Cloudinary"
            value={quickArtist.avatarUrl}
            onChange={(url) =>
              setQuickArtist((f) => ({ ...f, avatarUrl: url }))
            }
            onClear={() => setQuickArtist((f) => ({ ...f, avatarUrl: "" }))}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Tên nghệ sĩ *</label>
            <Input
              value={quickArtist.name}
              onChange={(e) =>
                setQuickArtist((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="VD: HIEUTHUHAI"
              autoFocus
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="Sửa sự kiện"
        description={
          editing ? resolvePolicy(editing).reason : undefined
        }
        size="xl"
        confirmLabel="Lưu"
        confirmLoading={editSaving}
        onConfirm={() => void handleSaveEdit()}
        className="gap-3"
      >
        {editing &&
          (() => {
            const policy = resolvePolicy(editing);
            const lockPlace = !policy.canChangePlace;
            const lockPrice = !policy.canChangePrice;
            const lockDecrease = !policy.canDecreaseSeats;
            const lockZones = !policy.canModifyZones;
            const allowAdd = policy.canAddZone || policy.canModifyZones;
            return (
          <div className="grid max-h-[min(75vh,640px)] gap-3 overflow-y-auto pr-0.5">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Tiêu đề
              </label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
                className="h-8"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                setEditForm((f) => ({ ...f, isFeatured: !f.isFeatured }))
              }
              className={cn(
                "flex h-8 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors",
                editForm.isFeatured
                  ? "border-[#F97316]/50 bg-[#F97316]/10 text-[#F97316]"
                  : "border-border bg-input/30 text-muted-foreground hover:text-foreground",
              )}
            >
              <Star
                className={cn(
                  "size-3.5",
                  editForm.isFeatured && "fill-current",
                )}
              />
              {editForm.isFeatured
                ? "Đang nổi bật trên trang chủ"
                : "Đưa lên block Sự kiện nổi bật"}
            </button>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Mô tả
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="w-full resize-none rounded-lg border border-input bg-input/30 px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Nhà tổ chức
              </label>
              <Input
                value={editForm.organizerName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, organizerName: e.target.value }))
                }
                className="h-8"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Địa điểm
              </label>
              <select
                value={editForm.placeId}
                disabled={lockPlace}
                onChange={(e) => applyEditPlace(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {!editForm.placeId && (
                  <option value="">— Chọn địa điểm —</option>
                )}
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} {p.name} ({p.city}) · {p.zones.length} khu
                  </option>
                ))}
              </select>
              {lockPlace && (
                <p className="text-[10px] text-muted-foreground">
                  {policy.status === "upcoming"
                    ? "Sắp diễn ra — không đổi địa điểm."
                    : "Đang mở bán — không đổi địa điểm."}
                </p>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1 rounded-lg border border-border bg-muted/20 p-2">
                <p className="text-[10px] font-semibold">Bắt đầu</p>
                <div className="grid grid-cols-[1.4fr_1fr] gap-1.5">
                  <Input
                    disabled={!policy.canEditSensitive}
                    placeholder="dd/mm/yyyy"
                    value={editForm.startDate}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        startDate: formatDateInput(e.target.value),
                      }))
                    }
                    maxLength={10}
                    className="h-8"
                  />
                  <Input
                    type="time"
                    disabled={!policy.canEditSensitive}
                    value={editForm.startTime}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, startTime: e.target.value }))
                    }
                    className="h-8"
                  />
                </div>
              </div>
              <div className="space-y-1 rounded-lg border border-border bg-muted/20 p-2">
                <p className="text-[10px] font-semibold">Kết thúc</p>
                <div className="grid grid-cols-[1.4fr_1fr] gap-1.5">
                  <Input
                    disabled={!policy.canEditSensitive}
                    placeholder="dd/mm/yyyy"
                    value={editForm.endDate}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        endDate: formatDateInput(e.target.value),
                      }))
                    }
                    maxLength={10}
                    className="h-8"
                  />
                  <Input
                    type="time"
                    disabled={!policy.canEditSensitive}
                    value={editForm.endTime}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, endTime: e.target.value }))
                    }
                    className="h-8"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Khu vực / hạng vé
                </p>
                {allowAdd && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={addEditZone}
                  >
                    <Plus className="size-3" />
                    Thêm khu
                  </Button>
                )}
              </div>
              {(lockPrice || lockDecrease) && (
                <p className="text-[10px] text-muted-foreground">
                  {[
                    lockPrice ? "Không đổi giá vé đã có." : "",
                    lockDecrease
                      ? "Không giảm số ghế (được tăng)."
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              )}
              {editZones.map((z, idx) => {
                const lockedRow = lockZones && Boolean(z.eventZoneId);
                const existing = Boolean(z.eventZoneId);
                const minSeats = Math.max(
                  1,
                  z.soldTickets ?? 0,
                  lockDecrease && existing ? (z.originalSeats ?? 1) : 0,
                );
                return (
                  <div
                    key={z.key}
                    className="rounded-lg border border-border bg-muted/20 p-2.5"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        Khu #{idx + 1}
                        {z.soldTickets ? ` · đã bán ${z.soldTickets}` : ""}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        disabled={
                          editZones.length <= 1 ||
                          (z.soldTickets ?? 0) > 0 ||
                          (lockDecrease && existing) ||
                          (lockZones && existing)
                        }
                        onClick={() => removeEditZone(z.key)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                      <Input
                        disabled={lockedRow}
                        value={z.name}
                        onChange={(e) =>
                          updateEditZone(z.key, {
                            name: e.target.value,
                            zoneId: undefined,
                          })
                        }
                        placeholder="Tên khu"
                        className="h-8"
                      />
                      <Input
                        type="number"
                        disabled={lockedRow || (lockPrice && existing)}
                        min={1}
                        value={z.price}
                        onChange={(e) =>
                          updateEditZone(z.key, { price: e.target.value })
                        }
                        placeholder="Giá"
                        className="h-8"
                      />
                      <Input
                        type="number"
                        disabled={lockedRow}
                        min={minSeats}
                        value={z.totalSeats}
                        onChange={(e) =>
                          updateEditZone(z.key, { totalSeats: e.target.value })
                        }
                        placeholder="Tổng ghế"
                        className="h-8"
                      />
                      {z.hasSeats ? (
                        <Input
                          type="number"
                          disabled={lockedRow}
                          min={1}
                          value={z.rowCount}
                          onChange={(e) =>
                            updateEditZone(z.key, { rowCount: e.target.value })
                          }
                          placeholder="Số hàng"
                          className="h-8"
                        />
                      ) : (
                        <div className="flex h-8 items-center rounded-lg border border-dashed border-border px-2 text-[11px] text-muted-foreground">
                          Đứng / GA
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={lockedRow}
                        onClick={() =>
                          updateEditZone(z.key, {
                            hasSeats: !z.hasSeats,
                            rowCount: !z.hasSeats ? z.rowCount || "10" : "",
                          })
                        }
                        className={cn(
                          "flex h-8 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium",
                          z.hasSeats
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border bg-input/30 text-muted-foreground",
                          lockedRow && "cursor-not-allowed opacity-60",
                        )}
                      >
                        {z.hasSeats ? (
                          <>
                            <Armchair className="size-3.5" /> Ghế
                          </>
                        ) : (
                          <>
                            <Users className="size-3.5" /> Đứng
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Banner
                </label>
                <ImageUpload
                  compact
                  folder="events"
                  variant="banner"
                  label="Upload"
                  value={editForm.bannerUrl}
                  onChange={(url) =>
                    setEditForm((f) => ({ ...f, bannerUrl: url }))
                  }
                  onClear={() =>
                    setEditForm((f) => ({ ...f, bannerUrl: "" }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Sơ đồ
                </label>
                <ImageUpload
                  compact
                  folder="maps"
                  variant="banner"
                  label="Upload"
                  value={editForm.mapUrl}
                  onChange={(url) =>
                    setEditForm((f) => ({ ...f, mapUrl: url }))
                  }
                  onClear={() => setEditForm((f) => ({ ...f, mapUrl: "" }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Logo
                </label>
                <ImageUpload
                  compact
                  folder="organizers"
                  variant="square"
                  label="Upload"
                  value={editForm.logoUrl}
                  onChange={(url) =>
                    setEditForm((f) => ({ ...f, logoUrl: url }))
                  }
                  onClear={() => setEditForm((f) => ({ ...f, logoUrl: "" }))}
                />
              </div>
            </div>
          </div>
            );
          })()}
      </Modal>

      <AdminConfirmModal modal={modal} setModal={setModal} />
    </AdminPageShell>
  );
}
