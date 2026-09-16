import type { Request, Response } from "express";
import { OrderService } from "../service/order.service.js";

/**
 * Tạo đơn hàng thanh toán VietQR
 * POST /api/v1/orders/create
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { ticketId, quantity, unitPrice, userId } = req.body;

    const effectiveUserId = userId || req.auth?.userId;
    if (!effectiveUserId) {
      return res.status(401).json({
        success: false,
        message: "Yêu cầu đăng nhập để mua vé",
      });
    }

    const orderData = await OrderService.createOrder({
      userId: Number(effectiveUserId),
      ticketId,
      quantity,
      unitPrice,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo đơn hàng VietQR thành công",
      data: orderData,
    });
  } catch (error: any) {
    console.error("createOrder controller error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Không thể tạo liên kết thanh toán VietQR",
    });
  }
};

/**
 * Tra cứu trạng thái đơn hàng theo orderCode
 * GET /api/v1/orders/:orderCode/status
 */
export const getOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderCode } = req.params;
    if (!orderCode) {
      return res.status(400).json({ success: false, message: "Thiếu orderCode" });
    }

    const order = await OrderService.getOrderStatus(orderCode);
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message });
  }
};

/**
 * Tra cứu tên chủ sở hữu tài khoản ngân hàng qua VietQR API
 * POST /api/v1/orders/lookup-account
 */
export const lookupBankAccount = async (req: Request, res: Response) => {
  try {
    const { bin, accountNumber } = req.body;
    if (!bin || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Yêu cầu mã BIN ngân hàng và số tài khoản",
      });
    }

    const accountData = await OrderService.lookupBankAccount(bin, accountNumber);

    return res.status(200).json({
      success: true,
      data: accountData,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Lỗi tra cứu tài khoản ngân hàng",
    });
  }
};
