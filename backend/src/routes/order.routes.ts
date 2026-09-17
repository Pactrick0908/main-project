import { Router } from "express";
import {
  createOrder,
  getOrderStatus,
  getPayOSPaymentStatus,
  lookupBankAccount,
} from "../controller/order.controller.js";

const router = Router();

router.post("/create", createOrder);
router.post("/lookup-account", lookupBankAccount);
router.get("/:orderCode/payos", getPayOSPaymentStatus);
router.get("/:orderCode/status", getOrderStatus);

export default router;
