import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  listPlaces,
  searchCatalog,
  stopEventSales,
  updateEvent,
} from "../controller/event.controller.js";
import { requirePermission } from "../middleware/rbac.middleware.js";
import { PERMISSIONS } from "../rbac/permissions.js";

const router = Router();

router.get("/", listEvents);
router.get("/search", searchCatalog);
router.get("/places", requirePermission(PERMISSIONS.PLACE_MANAGE), listPlaces);
router.get("/:id", getEvent);
router.post(
  "/",
  requirePermission(PERMISSIONS.EVENT_CREATE, (req) => ({
    organizerId:
      Number(req.body?.organizerId) > 0
        ? Number(req.body.organizerId)
        : req.auth?.userId,
  })),
  createEvent,
);
router.post(
  "/:id/stop-sales",
  requirePermission(PERMISSIONS.EVENT_UPDATE),
  stopEventSales,
);
router.patch("/:id", requirePermission(PERMISSIONS.EVENT_UPDATE), updateEvent);
router.delete("/:id", requirePermission(PERMISSIONS.EVENT_DELETE), deleteEvent);

export default router;
