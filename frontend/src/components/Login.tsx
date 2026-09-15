import {
  GoogleOAuthProvider,
  GoogleLogin,
  type CredentialResponse,
} from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { authApi, saveSession } from "../api/auth.api";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;

export default function Login() {
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      console.error("Không nhận được credential từ Google");
      return;
    }

    try {
      const data = await authApi.loginWithGoogle(idToken);
      saveSession(data.token, data.user);
      navigate("/my-tickets", { replace: true });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Đăng nhập thất bại");
    }
  };

  const handleError = () => {
    console.error("Google Login Failed");
  };

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
