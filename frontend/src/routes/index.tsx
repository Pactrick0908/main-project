import { Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import AdminPage from "../pages/AdminPage";
import MyTicketsPage from "../pages/MyTicketsPage";
import ScannerPage from "../pages/ScannerPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/my-tickets" element={<MyTicketsPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/scanner" element={<ScannerPage />} />
    </Routes>
  );
}
