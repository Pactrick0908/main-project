import { Router } from "express";
import AuthRouter from "./auth.routes.js";
import TicketRouter from "./ticket.routes.js";
import OrderRouter from "./order.routes.js";
import WebhookRouter from "./webhook.routes.js";

const router = Router();
router.use("/auth", AuthRouter);
router.use("/tickets", TicketRouter);
router.use("/orders", OrderRouter);
router.use("/webhook", WebhookRouter);

export default router;
