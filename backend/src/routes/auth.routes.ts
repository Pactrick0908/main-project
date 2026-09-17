import { Router } from "express";
import { login, loginDemo, loginAdminDemo } from "../controller/auth.controller.js";

const router = Router();
router.post("/login", login);
router.post("/google", login);
router.post("/demo", loginDemo);
router.post("/admin-demo", loginAdminDemo);

export default router;
