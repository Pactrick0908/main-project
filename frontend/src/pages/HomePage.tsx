import { Link } from "react-router-dom";
import { getStoredUser } from "../api/auth.api";

function HomePage() {
  const user = getStoredUser();

  return (
    <div className="min-h-screen bg-[#0b0f14] px-6 py-16 text-white">
      <div className="mx-auto max-w-xl">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Solana Tickets</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Concert Gate</h1>
        <p className="mt-3 text-white/55">
          Vé cNFT + Dynamic QR 60s. Đăng nhập để xem vé, hoặc mở trạm soát tại cổng.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={user ? "/my-tickets" : "/login"}
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black"
          >
            {user ? "Vé của tôi" : "Đăng nhập"}
          </Link>
          <Link
            to="/admin/scanner"
            className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium hover:bg-white/15"
          >
            Trạm soát vé
          </Link>
          <Link
            to="/admin"
            className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium hover:bg-white/15"
          >
            Admin
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
