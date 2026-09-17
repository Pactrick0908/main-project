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
import {
  assignUserRole,
  listRoles,
  listUsers,
} from "../controller/rbac.controller.js";
import {
  requireAdmin,
  requireAdminAccess,
  requireRolesGrant,
} from "../middleware/auth.middleware.js";

const router = Router();

// Mọi route admin cần ít nhất quyền vào khu vực admin
router.use(requireAdminAccess);

// Dashboard: admin/manager/organizer (nội dung lọc theo permission trong controller)
router.get("/dashboard", getDashboard);

// Phân quyền — chỉ admin
router.get("/roles", requireRolesGrant, listRoles);
router.get("/users", requireRolesGrant, listUsers);
router.patch("/users/:id/role", requireRolesGrant, assignUserRole);

// Vận hành — admin + manager
router.get("/tickets", requireAdmin, listAdminTickets);
router.post("/tickets/:id/check-in", requireAdmin, manualCheckIn);
router.post("/tickets/:id/revoke", requireAdmin, revokeTicket);
router.post("/tickets/:id/mint-onchain", requireAdmin, mintTicketOnChain);
router.post("/tickets/mint-onchain", requireAdmin, mintTicketOnChain);
router.post("/airdrop", requireAdmin, airdropTicket);

router.get("/places", requireAdmin, listPlacesAdmin);
router.post("/places", requireAdmin, createPlace);
router.patch("/places/:id", requireAdmin, updatePlace);
router.delete("/places/:id", requireAdmin, deletePlace);
router.get("/organizers", requireAdmin, listOrganizers);
router.post("/organizers", requireAdmin, createOrganizer);
router.patch("/organizers/:id", requireAdmin, updateOrganizer);
router.delete("/organizers/:id", requireAdmin, deleteOrganizer);

router.get("/artists", requireAdmin, listArtists);
router.post("/artists", requireAdmin, createArtist);
router.patch("/artists/:id", requireAdmin, updateArtist);
router.delete("/artists/:id", requireAdmin, deleteArtist);

router.post(
  "/upload",
  requireAdmin,
  uploadImageMiddleware,
  handleUploadError,
  uploadImage,
);

export default router;
