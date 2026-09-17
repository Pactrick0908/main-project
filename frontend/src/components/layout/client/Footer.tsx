import { Phone, Mail, MapPin, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CUSTOMER_LINKS = [
  { label: "Điều khoản sử dụng cho khách hàng", href: "#" },
  { label: "Hướng dẫn mua vé", href: "#" },
  { label: "Chính sách hoàn vé", href: "#" },
];

const ORGANIZER_LINKS = [
  { label: "Điều khoản sử dụng cho ban tổ chức", href: "#" },
  { label: "Hướng dẫn tạo sự kiện", href: "#" },
  { label: "Chính sách phí dịch vụ", href: "#" },
];

const COMPANY_LINKS = [
  { label: "Quy chế hoạt động sàn TMĐT", href: "#" },
  { label: "Bảo mật thông tin", href: "#" },
  { label: "Khiếu nại và giải quyết tranh chấp", href: "#" },
  { label: "Chính sách đổi trả & hoàn tiền", href: "#" },
  { label: "Phương thức thanh toán", href: "#" },
  { label: "Câu hỏi thường gặp (FAQ)", href: "#" },
];

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.83 1.54V6.78a4.85 4.85 0 0 1-1.06-.09z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function AppBadge({ store }: { store: "google" | "apple" }) {
  return (
    <a
      href="#"
      className="inline-flex items-center gap-2 rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-2 transition-colors hover:border-slate-500 hover:bg-slate-700/60"
    >
      {store === "google" ? (
        <>
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0 text-slate-200">
            <path d="M3.18 23.76c.35.2.76.22 1.14.08L15.5 12 4.32.16C3.94.02 3.53.04 3.18.24 2.5.63 2.07 1.36 2.07 2.2v19.6c0 .84.43 1.57 1.11 1.96z" />
            <path d="M19.37 10.17 16.5 8.5 13.24 12l3.26 3.5 2.87-1.67c.83-.48 1.33-1.36 1.33-2.33s-.5-1.85-1.33-2.33z" />
            <path fillOpacity={0.6} d="M4.32.16 15.5 12 4.32 23.84a1.4 1.4 0 0 0 .34-.08l11.84-6.26L4.32.16z" />
          </svg>
          <div className="text-left">
            <div className="text-[9px] leading-none text-slate-400">GET IT ON</div>
            <div className="text-[12px] font-semibold leading-tight text-slate-100">Google Play</div>
          </div>
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0 text-slate-200">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.73M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <div className="text-left">
            <div className="text-[9px] leading-none text-slate-400">Download on the</div>
            <div className="text-[12px] font-semibold leading-tight text-slate-100">App Store</div>
          </div>
        </>
      )}
    </a>
  );
}

function MctBadge({ type }: { type: "registered" | "licensed" }) {
  const isRed = type === "registered";
  return (
    <a
      href="#"
      className={`inline-flex w-[100px] flex-col items-center justify-center rounded-lg border px-2 py-2.5 text-center transition-opacity hover:opacity-80 ${
        isRed ? "border-red-700/60 bg-red-950/40" : "border-purple-700/60 bg-purple-950/40"
      }`}
    >
      <span className={`text-[8px] font-bold uppercase leading-tight tracking-wider ${isRed ? "text-red-400" : "text-purple-400"}`}>
        {isRed ? "Đã đăng ký" : "Đã cấp phép"}
      </span>
      <div className={`my-1.5 flex h-7 w-7 items-center justify-center rounded-full ${isRed ? "bg-red-600" : "bg-purple-600"}`}>
        <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
        </svg>
      </div>
      <span className={`text-[8px] font-semibold uppercase ${isRed ? "text-red-500" : "text-purple-500"}`}>
        Bộ Công Thương
      </span>
      <span className={`mt-0.5 text-[7px] font-medium ${isRed ? "text-red-600" : "text-purple-600"}`}>
        {isRed ? "DATHONGBAO.BCT" : "ONLINE.GOV.VN"}
      </span>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FOOTER
// ─────────────────────────────────────────────────────────────────────────────
export default function Footer() {
  return (
    <footer className="w-full">

      {/* ══════════════════════════════════════
          PHẦN TRÊN — MAIN CONTENT
      ══════════════════════════════════════ */}
      <div className="bg-[#1e2640]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-12">

            {/* ── CỘT 1: LIÊN HỆ ─────────────────── */}
            <div className="space-y-6">
              {/* HOTLINE */}
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Hỗ trợ khách hàng
                </p>
                <p className="text-[11px] text-slate-400">Thứ 2 – Chủ Nhật &nbsp;·&nbsp; 8:00 – 23:00</p>
                <a href="tel:19006408" className="group mt-1.5 flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-2xl font-bold tracking-wide text-emerald-400 transition-colors group-hover:text-emerald-300">
                    1900.6408
                  </span>
                </a>
              </div>

              {/* EMAIL */}
              <a
                href="mailto:support@ticketbox.vn"
                className="flex items-center gap-2.5 text-slate-300 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-sm">support@ticketbox.vn</span>
              </a>

              {/* ĐỊA CHỈ */}
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <p className="text-sm leading-relaxed text-slate-400">
                  Tầng 7, 3C Duy Tân, Phường Dịch Vọng Hậu,
                  Quận Cầu Giấy, Thành phố Hà Nội
                </p>
              </div>

              {/* APP BADGES */}
              <div className="border-t border-slate-700/50 pt-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  Ứng dụng TicketFest
                </p>
                <div className="flex flex-wrap gap-2">
                  <AppBadge store="google" />
                  <AppBadge store="apple" />
                </div>
              </div>
            </div>

            {/* ── CỘT 2: ĐIỀU KHOẢN ──────────────── */}
            <div className="space-y-6">
              {/* DÀNH CHO KHÁCH HÀNG */}
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  Dành cho Khách hàng
                </p>
                <ul className="space-y-2">
                  {CUSTOMER_LINKS.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
                      >
                        <ChevronRight className="h-3 w-3 shrink-0 text-slate-600" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* DÀNH CHO BAN TỔ CHỨC */}
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  Dành cho Ban Tổ chức
                </p>
                <ul className="space-y-2">
                  {ORGANIZER_LINKS.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
                      >
                        <ChevronRight className="h-3 w-3 shrink-0 text-slate-600" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* APP CHECK-IN */}
              <div className="border-t border-slate-700/50 pt-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  App check-in cho Ban tổ chức
                </p>
                <div className="flex flex-wrap gap-2">
                  <AppBadge store="google" />
                  <AppBadge store="apple" />
                </div>
              </div>
            </div>

            {/* ── CỘT 3: CÔNG TY & SOCIAL ────────── */}
            <div className="space-y-6">
              {/* VỀ CÔNG TY */}
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  Về công ty chúng tôi
                </p>
                <ul className="space-y-2">
                  {COMPANY_LINKS.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
                      >
                        <ChevronRight className="h-3 w-3 shrink-0 text-slate-600" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SOCIAL MEDIA */}
              <div className="border-t border-slate-700/50 pt-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  Follow us
                </p>
                <div className="flex items-center gap-2">
                  {SOCIAL_LINKS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-600/60 bg-slate-800/60 text-slate-300 transition-colors hover:border-slate-400 hover:bg-slate-700 hover:text-white"
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* NGÔN NGỮ */}
              <div>
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  Ngôn ngữ
                </p>
                <div className="flex items-center gap-2">
                  <button className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-700">
                    <span className="text-base leading-none">🇻🇳</span>
                    Tiếng Việt
                  </button>
                  <button className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700/40 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-slate-200">
                    <span className="text-base leading-none">🇬🇧</span>
                    English
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PHẦN DƯỚI — BOTTOM LEGAL BAR
      ══════════════════════════════════════ */}
      <div className="bg-[#181a20]">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-center md:gap-8">

            {/* LEFT: LOGO + COPYRIGHT */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F97316]">
                  <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
                    <path d="M20 12v-2h-2V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2h2v-2zm-4 4H4V8h12v8zM22 9h-2v6h2V9z" />
                  </svg>
                </div>
                <span className="text-base font-bold tracking-tight text-white">
                  TicketFest
                </span>
              </div>
              <p className="max-w-[200px] text-[11px] leading-relaxed text-slate-500">
                Nền tảng mua bán và trao đổi vé sự kiện uy tín tại Việt Nam.
              </p>
              <p className="text-[11px] text-slate-600">© 2026 TicketFest</p>
            </div>

            {/* CENTER: LEGAL INFO */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-400">
                CÔNG TY CỔ PHẦN TICKETFEST VIỆT NAM
              </p>
              <p className="text-[10px] leading-relaxed text-slate-600">
                Đại diện pháp luật: Nguyễn Văn A
              </p>
              <p className="text-[10px] leading-relaxed text-slate-600">
                GPDKKD số: 0109 123 456 do Sở KH&amp;ĐT TP. Hà Nội cấp ngày 01/01/2026
              </p>
              <p className="text-[10px] text-slate-600">
                Địa chỉ ĐKKD: Tầng 7, 3C Duy Tân, Cầu Giấy, Hà Nội
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <Link to="/" className="text-[10px] text-slate-600 transition-colors hover:text-slate-400">
                  Chính sách bảo mật
                </Link>
                <span className="text-slate-700">·</span>
                <Link to="/" className="text-[10px] text-slate-600 transition-colors hover:text-slate-400">
                  Điều khoản dịch vụ
                </Link>
                <span className="text-slate-700">·</span>
                <Link to="/" className="text-[10px] text-slate-600 transition-colors hover:text-slate-400">
                  Cookie
                </Link>
              </div>
            </div>

            {/* RIGHT: BCT BADGES */}
            <div className="flex flex-col gap-2 md:items-end">
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-600">
                Chứng nhận
              </p>
              <div className="flex items-center gap-3">
                <MctBadge type="registered" />
                <MctBadge type="licensed" />
              </div>
            </div>

          </div>
        </div>
      </div>

    </footer>
  );
}
