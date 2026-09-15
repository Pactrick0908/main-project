import { useState } from "react";
import { Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Login from "../components/Login";
import { authApi, saveSession } from "../api/auth.api";

function LoginPage() {
  const navigate = useNavigate();
  const [demoBusy, setDemoBusy] = useState(false);

  const handleDemoLogin = async () => {
    setDemoBusy(true);
    try {
      const data = await authApi.loginDemo();
      saveSession(data.token, data.user);
      navigate("/my-tickets", { replace: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Đăng nhập demo thất bại");
    } finally {
      setDemoBusy(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      {/* NỀN TRANG TRÍ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* CONTAINER CHÍNH */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-slate-100">
          {/* Header Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Ticket className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Solana Tickets
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Đăng nhập để xem vé và nhận mã QR check-in
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <Login />
            </div>
            <button
              type="button"
              onClick={() => void handleDemoLogin()}
              disabled={demoBusy}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {demoBusy ? "Đang vào…" : "Vào thử (không cần Google)"}
            </button>
          </div>

          <p className="text-xs text-center text-slate-400 mt-6 leading-relaxed">
            Khi đăng nhập, hệ thống sẽ tự sinh 1 ví Solana ngầm bảo mật tương
            ứng với tài khoản của bạn.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
