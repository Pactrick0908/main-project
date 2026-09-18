/**
 * Nghiệp vụ 4 trạng thái sự kiện:
 * - draft: sửa Full
 * - upcoming: Full trừ địa điểm và giá vé
 * - open: Full trừ địa điểm, giá bán; không giảm số ghế (được tăng)
 * - ended: không sửa gì
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
  /** Chỉ nháp — sửa tất cả kể cả địa điểm và giá */
  canEditAll: boolean;
  /** Truyền thông: title, description, banner, map, logo, organizerName */
  canEditMarketing: boolean;
  /** Lịch diễn / cấu trúc zone (không gồm địa điểm & giá khi khóa) */
  canEditSensitive: boolean;
  canChangePlace: boolean;
  canChangePrice: boolean;
  canModifyZones: boolean;
  canAddZone: boolean;
  /** Đang bán: không giảm totalSeats (vẫn được tăng) */
  canDecreaseSeats: boolean;
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
      canDecreaseSeats: false,
      canDeleteEvent: false,
      canChangeStatus: false,
      reason: "Đã kết thúc — không được sửa gì.",
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
      canDecreaseSeats: true,
      canDeleteEvent: true,
      canChangeStatus: true,
      reason: "Nháp — được sửa Full.",
    };
  }

  if (status === "upcoming") {
    return {
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
    };
  }

  // open
  return {
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
}

/** Các field truyền thông được phép PATCH khi không full-edit */
export const MARKETING_FIELDS = [
  "title",
  "description",
  "organizerName",
  "bannerUrl",
  "mapUrl",
  "logoUrl",
  "isFeatured",
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

  if (
    !policy.canChangePlace &&
    keys.some((k) => k === "placeId" || k === "place")
  ) {
    throw Object.assign(new Error("Không được đổi địa điểm ở trạng thái này."), {
      status: 403,
    });
  }

  if (
    !policy.canEditSensitive &&
    keys.some(
      (k) =>
        k === "startTime" ||
        k === "endTime" ||
        k === "schedules" ||
        k === "saleOpensAt",
    )
  ) {
    throw Object.assign(new Error("Không được đổi lịch diễn ở trạng thái này."), {
      status: 403,
    });
  }

  if (
    !policy.canModifyZones &&
    !policy.canAddZone &&
    keys.includes("zones")
  ) {
    throw Object.assign(new Error("Không được sửa hạng vé / zone."), {
      status: 403,
    });
  }

  const allowed = new Set<string>([...MARKETING_FIELDS, "status"]);
  if (policy.canChangePlace) {
    allowed.add("placeId");
    allowed.add("place");
  }
  if (policy.canEditSensitive) {
    allowed.add("startTime");
    allowed.add("endTime");
    allowed.add("schedules");
    allowed.add("saleOpensAt");
  }
  if (policy.canModifyZones || policy.canAddZone) {
    allowed.add("zones");
  }

  const unknown = keys.filter((k) => !allowed.has(k));
  if (unknown.length > 0) {
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

/** Không giảm dưới số vé đã bán; đang bán thì không giảm so với cung hiện tại. */
export function assertZoneCapacityChange(
  soldCount: number,
  nextTotalSeats: number,
  zoneName?: string,
  opts?: { currentTotal?: number; canDecreaseSeats?: boolean },
): void {
  const label = zoneName ? ` khu "${zoneName}"` : "";
  if (nextTotalSeats < soldCount) {
    throw Object.assign(
      new Error(
        `Không giảm số ghế${label} xuống ${nextTotalSeats} — đã bán ${soldCount} vé.`,
      ),
      { status: 409 },
    );
  }
  if (
    opts?.canDecreaseSeats === false &&
    opts.currentTotal != null &&
    nextTotalSeats < opts.currentTotal
  ) {
    throw Object.assign(
      new Error(
        `Đang mở bán — không giảm số ghế${label} (hiện ${opts.currentTotal}, chỉ được tăng).`,
      ),
      { status: 409 },
    );
  }
}
