import { Router } from "express";
import AuthRouter from "./auth.routes.js";
import TicketRouter from "./ticket.routes.js";
import OrderRouter from "./order.routes.js";
import WebhookRouter from "./webhook.routes.js";
import EventRouter from "./event.routes.js";
import AdminRouter from "./admin.routes.js";
import MarketplaceRouter from "./marketplace.routes.js";

const router = Router();
router.use("/auth", AuthRouter);
router.use("/tickets", TicketRouter);
router.use("/orders", OrderRouter);
router.use("/webhook", WebhookRouter);
router.use("/events", EventRouter);
router.use("/admin", AdminRouter);
router.use("/marketplace", MarketplaceRouter);

export default router;
