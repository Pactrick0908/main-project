import { useEffect } from "react";
import Header from "@/components/layout/client/Header";
import Footer from "@/components/layout/client/Footer";
import { Outlet, useLocation } from "react-router-dom";

function MainLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-[#090A0F] text-zinc-100 flex flex-col selection:bg-[#F97316] selection:text-white overflow-x-hidden font-sans antialiased">
      <div className="relative z-10 flex flex-col flex-1">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default MainLayout;
