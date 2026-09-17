import { Router } from "express";
import {
  airdropTicket,
  getDashboard,
  listAdminTickets,
  manualCheckIn,
  revokeTicket,
} from "../controller/admin.controller.js";
import {
  createOrganizer,
  createPlace,
  deleteOrganizer,
  deletePlace,
  listOrganizers,
  listPlacesAdmin,
  updateOrganizer,
  updatePlace,
} from "../controller/catalog.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// router.use(requireAdmin);

router.get("/dashboard", getDashboard);
router.get("/tickets", listAdminTickets);
router.post("/tickets/:id/check-in", manualCheckIn);
router.post("/tickets/:id/revoke", revokeTicket);
router.post("/airdrop", airdropTicket);

router.get("/places", listPlacesAdmin);
router.post("/places", createPlace);
router.patch("/places/:id", updatePlace);
router.delete("/places/:id", deletePlace);
router.get("/organizers", listOrganizers);
router.post("/organizers", createOrganizer);
router.patch("/organizers/:id", updateOrganizer);
router.delete("/organizers/:id", deleteOrganizer);

export default router;
