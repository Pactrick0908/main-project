import { Router } from "express";
import {
  airdropTicket,
  getDashboard,
  listAdminTickets,
  manualCheckIn,
  revokeTicket,
} from "../controller/admin.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAdmin);

router.get("/dashboard", getDashboard);
router.get("/tickets", listAdminTickets);
router.post("/tickets/:id/check-in", manualCheckIn);
router.post("/tickets/:id/revoke", revokeTicket);
router.post("/airdrop", airdropTicket);

export default router;
