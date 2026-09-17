import { Outlet } from "react-router-dom";

function LoginLayout() {
  return (
    <div className="min-h-screen bg-[#090A0F] relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-60 -left-60 h-[500px] w-[500px] rounded-full bg-[#F97316]/10 blur-[120px]" />
        <div className="absolute -bottom-60 -right-60 h-[500px] w-[500px] rounded-full bg-amber-500/8 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-orange-600/5 blur-[80px]" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}

export default LoginLayout;
