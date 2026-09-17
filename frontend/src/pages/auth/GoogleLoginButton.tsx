import {
  GoogleOAuthProvider,
  GoogleLogin,
  type CredentialResponse,
} from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { authApi, saveSession } from "@/api/auth.api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID as string | undefined;

export default function GoogleLoginButton() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = async (res: CredentialResponse) => {
    const idToken = res.credential;
    if (!idToken) return;

    try {
      const session = await authApi.loginWithGoogle(idToken);
      login(session.user, session.token);
      saveSession(session.token, session.user);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      toast.error(msg);
    }
  };

  const handleError = () => {
    toast.error("Google đăng nhập thất bại. Vui lòng thử lại.");
  };

  if (!CLIENT_ID) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-center text-xs text-red-400">
        ⚠️ Chưa cấu hình <code className="font-mono">VITE_CLIENT_ID</code> trong{" "}
        <code className="font-mono">.env</code>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        shape="rectangular"
        theme="filled_black"
        size="large"
        text="signin_with"
        // locale="vi"
      />
    </GoogleOAuthProvider>
  );
}
