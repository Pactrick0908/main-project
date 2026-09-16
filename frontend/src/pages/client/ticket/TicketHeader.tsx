import { Link } from "react-router-dom";
import type { AuthUser } from "@/api/auth.api";

interface TicketHeaderProps {
  user: AuthUser | null;
  issuing: boolean;
  onIssueDemo: () => void;
  onLogout: () => void;
}

export default function TicketHeader({
  user,
  issuing,
  onIssueDemo,
  onLogout,
}: TicketHeaderProps) {
  return (
    <header className="border-b border-white/10 px-4 py-4 sm:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div>
          <Link to="/" className="text-sm text-white/50 hover:text-white transition-colors">
            ← Trang chủ
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Vé của tôi</h1>
          {user && (
            <p className="text-sm text-white/50">
              {user.name} · {user.walletAddress?.slice(0, 4)}…{user.walletAddress?.slice(-4)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onIssueDemo}
            disabled={issuing}
            className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {issuing ? "Đang cấp…" : "+ Vé demo"}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/15 cursor-pointer transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
