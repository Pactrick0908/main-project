/**
 * Nghiệp vụ 4 trạng thái sự kiện:
 * - draft: sửa Full
 * - upcoming: Full nếu chưa từng bán; khóa nhạy cảm nếu đã có vé
 * - open (aliases: active, published): chỉ truyền thông; khóa place/zones/price
 * - ended (alias: completed): read-only toàn bộ
 */

export const EVENT_STATUSES = ["draft", "upcoming", "open", "ended"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const BOOKED_TICKET_STATUSES = [
  "sold",
  "held",
  "checked_in",
  "valid",
] as const;

export type EventEditPolicy = {
  status: EventStatus;
  /** Có vé đã đặt/bán (sold|held|checked_in|valid) */
  hasBookings: boolean;
  /** draft, hoặc upcoming chưa bán */
  canEditAll: boolean;
  /** Truyền thông: title, description, banner, map, logo, organizerName */
  canEditMarketing: boolean;
  /** placeId, zones, seats, price, lịch (nếu full) */
  canEditSensitive: boolean;
  canChangePlace: boolean;
  canChangePrice: boolean;
  canModifyZones: boolean;
  /** Tăng ghế / thêm zone mới khi đang open vẫn được; xóa zone có booking thì không */
  canAddZone: boolean;
  canDeleteEvent: boolean;
  canChangeStatus: boolean;
  /** Gợi ý UI */
  reason: string;
};

export function normalizeEventStatus(raw: string | null | undefined): EventStatus {
  const s = (raw ?? "draft").trim().toLowerCase();
  if (s === "active" || s === "published") return "open";
  if (s === "completed" || s === "finished") return "ended";
  if ((EVENT_STATUSES as readonly string[]).includes(s)) {
    return s as EventStatus;
  }
  return "draft";
}

export function isValidEventStatus(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  return (
    (EVENT_STATUSES as readonly string[]).includes(s) ||
    s === "active" ||
    s === "published" ||
    s === "completed" ||
    s === "finished"
  );
}

export function buildEventEditPolicy(
  statusRaw: string | null | undefined,
  hasBookings: boolean,
): EventEditPolicy {
  const status = normalizeEventStatus(statusRaw);

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
      reason:
        "Đã kết thúc — khóa toàn bộ để bảo toàn đối soát doanh thu / lịch sử vé.",
    };
  }

  if (status === "draft") {
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
      reason: "Nháp — được sửa Full (kể cả địa điểm, zone, giá, lịch).",
    };
  }

  if (status === "upcoming" && !hasBookings) {
    return {
      status,
      hasBookings: false,
      canEditAll: true,
      canEditMarketing: true,
      canEditSensitive: true,
      canChangePlace: true,
      canChangePrice: true,
      canModifyZones: true,
      canAddZone: true,
      canDeleteEvent: true,
      canChangeStatus: true,
      reason:
        "Sắp diễn ra (chưa mở bán) — chưa có vé → được sửa Full.",
    };
  }

  // open, hoặc upcoming đã có vé → khóa nhạy cảm như đang mở bán
  const lockedUpcoming = status === "upcoming" && hasBookings;
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
    reason: lockedUpcoming
      ? "Sắp diễn ra (đã bán vé) — khóa địa điểm / zone / giá; chỉ sửa truyền thông."
      : "Đang mở bán — chỉ sửa truyền thông; khóa địa điểm, giá và cấu trúc zone đã bán.",
  };
}

/** Các field truyền thông được phép PATCH khi không full-edit */
export const MARKETING_FIELDS = [
  "title",
  "description",
  "organizerName",
  "bannerUrl",
  "mapUrl",
  "logoUrl",
] as const;

export type MarketingField = (typeof MARKETING_FIELDS)[number];

export function assertCanUpdateEvent(
  policy: EventEditPolicy,
  data: Record<string, unknown>,
): void {
  if (policy.status === "ended") {
    throw Object.assign(
      new Error(policy.reason || "Sự kiện đã kết thúc — không được sửa."),
      { status: 403 },
    );
  }

  const keys = Object.keys(data).filter(
    (k) => data[k] !== undefined,
  );

  if (keys.includes("status") && !policy.canChangeStatus) {
    throw Object.assign(
      new Error("Không được đổi trạng thái sự kiện này."),
      { status: 403 },
    );
  }

  if (policy.canEditAll) return;

  // Chỉ marketing (+ status) khi khóa nhạy cảm
  const sensitiveKeys = [
    "placeId",
    "place",
    "zones",
    "price",
    "totalSeats",
    "row",
    "rowCount",
    "startTime",
    "endTime",
    "schedules",
  ];
  const blocked = keys.filter((k) => sensitiveKeys.includes(k));
  if (blocked.length > 0) {
    throw Object.assign(
      new Error(
        `Trạng thái "${policy.status}" khóa trường nhạy cảm: ${blocked.join(", ")}. ${policy.reason}`,
      ),
      { status: 403 },
    );
  }

  const allowed = new Set<string>([...MARKETING_FIELDS, "status"]);
  const unknown = keys.filter((k) => !allowed.has(k));
  if (unknown.length > 0 && !policy.canEditMarketing) {
    throw Object.assign(
      new Error(`Không được sửa: ${unknown.join(", ")}`),
      { status: 403 },
    );
  }
}

export function assertCanDeleteEvent(policy: EventEditPolicy): void {
  if (!policy.canDeleteEvent) {
    throw Object.assign(
      new Error(
        policy.hasBookings
          ? "Không xóa được — sự kiện đã có vé. Hãy chuyển sang ended."
          : policy.reason || "Không được xóa sự kiện ở trạng thái này.",
      ),
      { status: 409 },
    );
  }
}

/** Khi open: không giảm totalSeats dưới số vé đã bán; không xóa zone có booking */
export function assertZoneCapacityChange(
  soldCount: number,
  nextTotalSeats: number,
  zoneName?: string,
): void {
  if (nextTotalSeats < soldCount) {
    throw Object.assign(
      new Error(
        `Không giảm số ghế${zoneName ? ` khu "${zoneName}"` : ""} xuống ${nextTotalSeats} — đã bán ${soldCount} vé.`,
      ),
      { status: 409 },
    );
  }
}
