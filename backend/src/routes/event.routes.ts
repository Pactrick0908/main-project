import { Router } from "express";
import {
  listEvents,
  getEventById,
  seedEvents,
} from "../controller/event.controller.js";

const router = Router();

router.get("/", listEvents);
router.get("/:id", getEventById);
router.post("/seed", seedEvents);

export default router;
