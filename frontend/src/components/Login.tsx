import {
  GoogleOAuthProvider,
  GoogleLogin,
  type CredentialResponse,
} from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;

export default function Login() {
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      console.error("Không nhận được credential từ Google");
      return;
    }
    console.log(idToken);

    navigate("/", { replace: true });
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
