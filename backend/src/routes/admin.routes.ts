import { Router } from "express";
import {
  airdropTicket,
  getDashboard,
  listAdminTickets,
  manualCheckIn,
  mintTicketOnChain,
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
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// router.use(requireAdmin);

router.get("/dashboard", getDashboard);
router.get("/tickets", listAdminTickets);
router.post("/tickets/:id/check-in", manualCheckIn);
router.post("/tickets/:id/revoke", revokeTicket);
router.post("/tickets/:id/mint-onchain", mintTicketOnChain);
router.post("/tickets/mint-onchain", mintTicketOnChain);
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
