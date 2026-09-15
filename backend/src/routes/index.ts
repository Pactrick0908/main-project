import { Router } from "express";
import AuthRouter from "./auth.routes.js";
import TicketRouter from "./ticket.routes.js";

const router = Router();
router.use("/auth", AuthRouter);
router.use("/tickets", TicketRouter);

export default router;
