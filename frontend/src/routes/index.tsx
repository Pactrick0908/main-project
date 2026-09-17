import { createBrowserRouter } from "react-router-dom";
import LoginPage from "@/pages/auth/LoginPage";
import HomePage from "@/pages/client/home/HomePage";
import Dashboard from "@/pages/admin/Dashboard";
import PlacePage from "@/pages/admin/PlacePage";
import OrganizerPage from "@/pages/admin/OrganizerPage";
import ArtistPage from "@/pages/admin/ArtistPage";
import EventPage from "@/pages/admin/EventPage";
import TicketPage from "@/pages/admin/TicketPage";
import AirdropPage from "@/pages/admin/AirdropPage";
import MainLayout from "@/layouts/client/MainLayout";
import LoginLayout from "@/layouts/auth/LoginLayout";
import MarketplacePage from "@/pages/client/market/MarketplacePage";
import AdminLayout from "@/layouts/admin/AdminLayout";
import MyTicketsPage from "@/pages/client/ticket/MyTicketsPage";
import ScannerPage from "@/pages/admin/ScannerPage";
import EventDetailPage from "@/pages/client/event/EventDetailPage";
import EventResalePage from "@/pages/client/market/resale/EventResalePage";
import SearchPage from "@/pages/client/search/SearchPage";

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
        path: "search",
        element: <SearchPage />,
      },
      {
        path: "my-tickets",
        element: <MyTicketsPage />,
      },
      {
        path: "events/:id",
        element: <EventDetailPage />,
      },
      {
        path: "events/:id/resale",
        element: <EventResalePage />,
      },
      {
        path: "marketplace",
        element: <MarketplacePage />,
      },
      {
        path: "marketplace/events/:id",
        element: <EventResalePage />,
      },
    ],
  },
  {
    path: "login",
    element: <LoginLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
  {
    path: "admin",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "places",
        element: <PlacePage />,
      },
      {
        path: "organizers",
        element: <OrganizerPage />,
      },
      {
        path: "artists",
        element: <ArtistPage />,
      },
      {
        path: "events",
        element: <EventPage />,
      },
      {
        path: "tickets",
        element: <TicketPage />,
      },
      {
        path: "airdrop",
        element: <AirdropPage />,
      },
      {
        path: "scanner",
        element: <ScannerPage />,
      },
    ],
  },
  {
    path: "*",
    element: <div>404 - Trang không tồn tại</div>,
  },
]);
