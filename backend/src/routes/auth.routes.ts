import { Router } from "express";
import { login, loginDemo } from "../controller/auth.controller.js";

const router = Router();
router.post("/login", login);
router.post("/google", login);
router.post("/demo", loginDemo);

export default router;
