import { createBrowserRouter } from "react-router-dom";
import LoginPage from "@/pages/auth/LoginPage";
import HomePage from "@/pages/client/home/HomePage";
import AdminPage from "@/pages/admin/AdminPage";
import MainLayout from "@/layouts/client/MainLayout";
import LoginLayout from "@/layouts/auth/LoginLayout";
import TicketPage from "@/pages/client/ticket/TicketPage";
import MarketplacePage from "@/pages/client/market/MarketplacePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "/ticket",
        element: <TicketPage />,
      },
      {
        path: "/marketplace",
        element: <MarketplacePage />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminPage />,
  },
  {
    path: "*",
    element: <div>404 - Trang không tồn tại</div>,
  },
]);
