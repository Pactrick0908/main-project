import { Router } from "express";
import {
  cancelListing,
  checkPrimaryRefundEligibility,
  createListing,
  createTrade,
  getListing,
  getTrade,
  getTradeByCode,
  listListings,
  myListings,
  myTrades,
  refundEscrowManual,
  releaseAfterEnded,
  releaseEscrowManual,
  settleEventCancel,
} from "../controller/marketplace.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/listings", listListings);
router.get("/listings/:id", getListing);
router.post("/listings", requireAuth, createListing);
router.delete("/listings/:id", requireAuth, cancelListing);

router.post("/trades", requireAuth, createTrade);
router.get("/trades/by-code/:code", getTradeByCode);
router.get("/trades/:id", requireAuth, getTrade);

router.get("/me/listings", requireAuth, myListings);
router.get("/me/trades", requireAuth, myTrades);

router.post(
  "/admin/events/:eventId/cancel-settle",
  requireAdmin,
  settleEventCancel,
);
router.post(
  "/admin/events/:eventId/release-ended",
  requireAdmin,
  releaseAfterEnded,
);
router.post(
  "/admin/tickets/:ticketId/release-escrow",
  requireAdmin,
  releaseEscrowManual,
);
router.post(
  "/admin/tickets/:ticketId/refund-escrow",
  requireAdmin,
  refundEscrowManual,
);
router.get(
  "/admin/tickets/:ticketId/primary-refund-eligibility",
  requireAdmin,
  checkPrimaryRefundEligibility,
);

export default router;
