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
  createArtist,
  deleteArtist,
  deleteOrganizer,
  deletePlace,
  listArtists,
  listOrganizers,
  listPlacesAdmin,
  updateArtist,
  updateOrganizer,
  updatePlace,
} from "../controller/catalog.controller.js";
import {
  handleUploadError,
  uploadImage,
  uploadImageMiddleware,
} from "../controller/upload.controller.js";
import { requireAuth, rejectCustomer } from "../middleware/auth.middleware.js";
import {
  assignRole,
  getMyPermissions,
  getRbacCatalog,
  revokeRole,
} from "../controller/rbac.controller.js";

const router = Router();

router.use(rejectCustomer);

// router.use(requireAdmin);

router.get("/me/permissions", requireAuth, getMyPermissions);
router.get("/rbac/catalog", requireAuth, getRbacCatalog);
router.post("/roles/assign", requireAuth, assignRole);
router.post("/roles/revoke", requireAuth, revokeRole);

router.get("/dashboard", requireAuth, getDashboard);
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

router.get("/artists", listArtists);
router.post("/artists", createArtist);
router.patch("/artists/:id", updateArtist);
router.delete("/artists/:id", deleteArtist);

router.post(
  "/upload",
  uploadImageMiddleware,
  handleUploadError,
  uploadImage,
);

export default router;
