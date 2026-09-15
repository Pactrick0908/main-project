import {
  GoogleOAuthProvider,
  GoogleLogin,
  type CredentialResponse,
} from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { jwtDecode } from "jwt-decode";
import { authApi } from "@/api/auth.api";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || "";

interface GoogleJwtPayload {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      console.error("Không nhận được credential từ Google");
      return;
    }

    try {
      const res = await authApi.loginWithGoogle(idToken);
      if (res && res.user) {
        login(
          {
            name: res.user.name,
            email: res.user.email,
            avatar: res.user.avatar,
            walletAddress: res.user.walletAddress,
          },
          res.token
        );
      }
    } catch {
      // Fallback decode token directly if backend is offline or during testing
      try {
        const decoded = jwtDecode<GoogleJwtPayload>(idToken);
        login(
          {
            name: decoded.name || "Người dùng Solana",
            email: decoded.email || "user@solana.io",
            avatar:
              decoded.picture ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
            walletAddress: "8xG7p9...41eF",
          },
          idToken
        );
      } catch (err) {
        console.error("Decode JWT failed", err);
      }
    }

    navigate("/", { replace: true });
  };

  const handleError = () => {
    console.error("Google Login Failed");
  };

  if (!CLIENT_ID) {
    return (
      <div className="text-center text-xs text-zinc-500 italic">
        (Chưa cấu hình VITE_CLIENT_ID cho Google OAuth)
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div style={{ display: "inline-block" }}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          shape="rectangular"
          theme="outline"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
