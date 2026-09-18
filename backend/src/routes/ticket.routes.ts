import { Router } from "express";
import {
  getTicketStatus,
  issueDemoTicket,
  issueTicketQr,
  listMyTickets,
  listTicketsAdmin,
  verifyTicket,
} from "../controller/ticket.controller.js";
import { requireAuth, requireScanner } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/mine", requireAuth, listMyTickets);
router.post("/demo", requireAuth, issueDemoTicket);
router.get("/:id/status", requireAuth, getTicketStatus);
router.post("/:id/qr", requireAuth, issueTicketQr);
router.post("/verify", requireScanner, verifyTicket);
router.get("/", listTicketsAdmin);

export default router;
