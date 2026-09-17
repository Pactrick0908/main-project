import { Link } from "react-router-dom";
import type { AuthUser } from "@/api/auth.api";

interface TicketHeaderProps {
  user: AuthUser | null;
  onLogout: () => void;
}

export default function TicketHeader({ user, onLogout }: TicketHeaderProps) {
  return (
    <header className="border-b border-white/10 px-4 py-4 sm:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div>
          <Link
            to="/"
            className="text-sm text-white/50 transition-colors hover:text-white"
          >
            ← Trang chủ
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Vé của tôi
          </h1>
          {user && (
            <p className="text-sm text-white/50">
              {user.name}
              {user.walletAddress
                ? ` · ${user.walletAddress.slice(0, 4)}…${user.walletAddress.slice(-4)}`
                : ""}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="cursor-pointer rounded-lg bg-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/15"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
