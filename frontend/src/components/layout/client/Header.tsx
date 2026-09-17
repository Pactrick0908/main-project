import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import HeaderSearch from "@/components/layout/client/HeaderSearch";
import {
  Ticket,
  Menu,
  LogOut,
  ChevronDown,
  PlusCircle,
  Home,
  Calendar,
  ShoppingBag,
} from "lucide-react";

interface NavLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navLinks: NavLink[] = [
    { name: "Trang chủ", href: "/", icon: <Home className="h-4 w-4" /> },
    {
      name: "Sự kiện",
      href: "/#events",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      name: "Chợ vé",
      href: "/marketplace",
      icon: <ShoppingBag className="h-4 w-4" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/" && !location.hash;
    if (href.startsWith("/#")) return location.hash === href.slice(1);
    return location.pathname === href;
  };

  const handleNavClick = (href: string) => {
    if (href.startsWith("/#")) {
      const id = href.replace("/#", "");
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(-2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/70 bg-[#090A0F]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900 text-[#F97316] transition-colors group-hover:border-[#F97316]/40">
            <Ticket className="h-3.5 w-3.5 -rotate-12" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            TicketFest
          </span>
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Trực tuyến
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 text-[13px] ml-2">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => handleNavClick(link.href)}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <HeaderSearch className="hidden lg:flex flex-1 max-w-72 xl:max-w-80 mx-auto" />

        <div className="ml-auto hidden sm:flex items-center gap-2.5 shrink-0">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 p-1 pr-2.5 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <Avatar size="sm">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-zinc-800 text-zinc-300 text-[10px]">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-24 truncate">{user.name}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-150 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-zinc-800 bg-[#0E0F16] shadow-2xl">
                  <div className="flex items-center gap-3 px-3 py-3">
                    <Avatar size="default">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-zinc-800 text-zinc-300 text-[11px]">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-white">
                        {user.name}
                      </div>
                      <div className="truncate text-[11px] text-zinc-500">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="mx-3 mb-2 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      <span>Thành viên đã xác thực</span>
                    </div>
                  </div>

                  <Separator className="bg-zinc-800/80" />

                  <div className="p-1.5">
                    <Link
                      to="/my-tickets"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Ticket className="h-3.5 w-3.5 text-[#F97316]" />
                        Vé của tôi
                      </div>
                    </Link>

                    <Link
                      to="/marketplace"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition-colors"
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-zinc-500" />
                      Đăng bán vé P2P
                    </Link>
                  </div>

                  <Separator className="bg-zinc-800/80" />

                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login">
              <Button
                size="sm"
                className="h-8 rounded-lg bg-[#F97316] hover:bg-[#ea6d0e] px-4 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Đăng nhập
              </Button>
            </Link>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          {!user && (
            <Link to="/login">
              <Button
                size="sm"
                className="h-8 rounded-lg bg-[#F97316] px-3 text-xs font-semibold text-white"
              >
                Đăng nhập
              </Button>
            </Link>
          )}

          <Sheet>
            <SheetTrigger className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white transition-colors cursor-pointer">
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 border-zinc-800 bg-[#0E0F16] p-0"
              showCloseButton={true}
            >
              <SheetHeader className="border-b border-zinc-800 px-4 py-3">
                <SheetTitle className="flex items-center gap-2 text-sm font-bold text-white">
                  <Ticket className="h-4 w-4 text-[#F97316]" />
                  TicketFest
                </SheetTitle>
              </SheetHeader>

              <div className="px-4 py-3 border-b border-zinc-800">
                <HeaderSearch variant="mobile" className="w-full" />
              </div>

              <nav className="flex flex-col gap-0.5 p-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => handleNavClick(link.href)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition-colors"
                  >
                    <span className="text-zinc-500">{link.icon}</span>
                    {link.name}
                  </Link>
                ))}
              </nav>

              {user && (
                <>
                  <Separator className="bg-zinc-800 mx-0" />
                  <div className="p-2">
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-zinc-900/50">
                      <Avatar size="sm">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-zinc-800 text-zinc-300 text-[10px]">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-white">
                          {user.name}
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/my-tickets"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition-colors"
                    >
                      <Ticket className="h-4 w-4 text-[#F97316]" />
                      Vé của tôi
                    </Link>

                    <Link
                      to="/marketplace"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition-colors"
                    >
                      <PlusCircle className="h-4 w-4 text-zinc-500" />
                      Đăng bán vé
                    </Link>
                  </div>

                  <Separator className="bg-zinc-800" />
                  <div className="p-2">
                    <button
                      onClick={() => logout()}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}

              {!user && (
                <>
                  <Separator className="bg-zinc-800" />
                  <div className="p-3">
                    <Link to="/login" className="block">
                      <button className="w-full rounded-lg bg-[#F97316] py-2.5 text-sm font-semibold text-white hover:bg-[#ea6d0e] transition-colors cursor-pointer">
                        Đăng nhập
                      </button>
                    </Link>
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
