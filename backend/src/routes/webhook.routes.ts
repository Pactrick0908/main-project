import { Router } from "express";
import { handlePayOSWebhook } from "../controller/webhook.controller.js";

const router = Router();

router.post("/payos", handlePayOSWebhook);

export default router;
