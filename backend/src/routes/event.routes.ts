import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  listPlaces,
  searchCatalog,
  updateEvent,
} from "../controller/event.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listEvents);
router.get("/search", searchCatalog);
router.get("/places", requireAdmin, listPlaces);
router.get("/:id", getEvent);
router.post("/", requireAdmin, createEvent);
router.patch("/:id", requireAdmin, updateEvent);
router.delete("/:id", requireAdmin, deleteEvent);

export default router;
