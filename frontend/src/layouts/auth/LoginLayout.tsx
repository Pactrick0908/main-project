import { Outlet } from "react-router-dom";

function LoginLayout() {
  return (
    <div>
      <h1>LoginLayout</h1>
      <Outlet />
    </div>
  );
}

export default LoginLayout;
