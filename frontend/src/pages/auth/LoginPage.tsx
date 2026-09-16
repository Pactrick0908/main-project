import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ticket, Zap, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import GoogleLoginButton from "@/pages/auth/GoogleLoginButton";
import { authApi } from "@/api/auth.api";
import { useAuth } from "@/context/AuthContext";

const FEATURES = [
  {
    icon: <Ticket className="h-4 w-4 text-[#F97316]" />,
    text: "Vé điện tử chính hãng có mã định danh",
  },
  {
    icon: <Zap className="h-4 w-4 text-[#F97316]" />,
    text: "Dynamic QR · Tự hết hạn sau 60s",
  },
  {
    icon: <ShieldCheck className="h-4 w-4 text-[#F97316]" />,
    text: "Ký quỹ trung gian · Giao dịch an toàn 100%",
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [demoBusy, setDemoBusy] = useState(false);

  const handleDemoLogin = async () => {
    setDemoBusy(true);
    try {
      const session = await authApi.loginDemo();
      login(session.user, session.token);
      navigate("/", { replace: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Đăng nhập demo thất bại");
    } finally {
      setDemoBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      {/* Back to home */}
      <Link
        to="/"
        className="absolute left-6 top-6 flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Trang chủ
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-[#F97316]/30 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#F97316]/30 bg-zinc-900">
              <Ticket className="h-8 w-8 text-[#F97316]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            TicketFest
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Đăng nhập để xem vé &amp; nhận mã QR check-in
          </p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm">
          {/* Feature chips */}
          <div className="mb-6 flex flex-col gap-2">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2"
              >
                {f.icon}
                <span className="text-xs text-zinc-400">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[11px] text-zinc-600">Đăng nhập với</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* Google login button */}
          <div className="flex flex-col items-center gap-3">
            <GoogleLoginButton />
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={demoBusy}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors cursor-pointer"
            >
              {demoBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Đăng nhập nhanh Demo
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-600">
          Tài khoản của bạn được bảo vệ với mã hóa bảo mật hai lớp an toàn tuyệt đối.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
