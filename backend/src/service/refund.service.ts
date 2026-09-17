import { prisma } from "../lib/prisma.js";
import type { Prisma, RefundLedgerKind } from "@prisma/client";

/**
 * Ledger chống double-pay: cùng ticket + user không nhận cả P2P_RELEASE và PRIMARY_REFUND.
 */
export class RefundService {
  static async hasLedgerEntry(
    ticketId: number,
    userId: number,
    kind: RefundLedgerKind,
    tx: Prisma.TransactionClient | typeof prisma = prisma,
  ) {
    const row = await tx.refundLedger.findUnique({
      where: {
        ticketId_kind_userId: { ticketId, kind, userId },
      },
    });
    return Boolean(row);
  }

  /** Seller đã nhận P2P → không được hoàn vé gốc. */
  static async canReceivePrimaryRefund(ticketId: number, userId: number) {
    if (await this.hasLedgerEntry(ticketId, userId, "P2P_RELEASE")) {
      return {
        ok: false as const,
        reason: "BLOCKED_P2P_RELEASE" as const,
        message:
          "User đã nhận giải ngân P2P cho vé này — không được hoàn vé gốc",
      };
    }
    return { ok: true as const };
  }

  static async recordLedger(params: {
    ticketId: number;
    userId: number;
    kind: RefundLedgerKind;
    amount: number;
    refType: string;
    refId: number;
    note?: string;
    tx?: Prisma.TransactionClient;
  }) {
    const client = params.tx ?? prisma;

    if (params.kind === "PRIMARY_REFUND") {
      const gate = await this.canReceivePrimaryRefund(
        params.ticketId,
        params.userId,
      );
      if (!gate.ok) {
        throw Object.assign(new Error(gate.message), { status: 409, code: gate.reason });
      }
    }

    if (params.kind === "P2P_RELEASE") {
      const hasPrimary = await this.hasLedgerEntry(
        params.ticketId,
        params.userId,
        "PRIMARY_REFUND",
        client,
      );
      if (hasPrimary) {
        throw Object.assign(
          new Error(
            "User đã nhận hoàn vé gốc — không được giải ngân P2P cùng vé",
          ),
          { status: 409, code: "BLOCKED_PRIMARY_REFUND" },
        );
      }
    }

    return client.refundLedger.create({
      data: {
        ticketId: params.ticketId,
        userId: params.userId,
        kind: params.kind,
        amount: params.amount,
        refType: params.refType,
        refId: params.refId,
        note: params.note,
      },
    });
  }

  /**
   * Ai được nhận hoàn sơ cấp khi BTC hủy sự kiện.
   * - Chưa RELEASED P2P: người mua Order gốc (nếu escrow HELD thì buyer P2P được hoàn riêng)
   * - Đã RELEASED: current ticket owner
   */
  static async eligiblePrimaryRefund(ticketId: number) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        originalOrder: true,
        trades: {
          where: { escrowStatus: { in: ["HELD", "RELEASED", "REFUNDED"] } },
          orderBy: { id: "desc" },
          take: 1,
        },
      },
    });

    if (!ticket) {
      throw Object.assign(new Error("Không tìm thấy vé"), { status: 404 });
    }

    const lastTrade = ticket.trades[0];
    const order = ticket.originalOrder;

    if (lastTrade?.escrowStatus === "RELEASED") {
      if (!ticket.userId) {
        return {
          eligible: false as const,
          reason: "NO_OWNER",
          message: "Vé đã bán P2P nhưng không còn owner",
        };
      }
      const gate = await this.canReceivePrimaryRefund(ticketId, ticket.userId);
      if (!gate.ok) {
        return { eligible: false as const, reason: gate.reason, message: gate.message };
      }
      return {
        eligible: true as const,
        beneficiaryUserId: ticket.userId,
        amount: order ? Number(order.totalAmount) / Math.max(1, order.quantity) : 0,
        source: "CURRENT_OWNER_AFTER_P2P_RELEASE" as const,
      };
    }

    const beneficiaryUserId =
      order?.userId ??
      (lastTrade?.escrowStatus === "HELD" || lastTrade?.escrowStatus === "REFUNDED"
        ? lastTrade.sellerId
        : ticket.userId);

    if (!beneficiaryUserId) {
      return {
        eligible: false as const,
        reason: "NO_BENEFICIARY",
        message: "Không xác định được người nhận hoàn sơ cấp",
      };
    }

    const gate = await this.canReceivePrimaryRefund(ticketId, beneficiaryUserId);
    if (!gate.ok) {
      return { eligible: false as const, reason: gate.reason, message: gate.message };
    }

    return {
      eligible: true as const,
      beneficiaryUserId,
      amount: order ? Number(order.totalAmount) / Math.max(1, order.quantity) : 0,
      source:
        lastTrade?.escrowStatus === "HELD" || lastTrade?.escrowStatus === "REFUNDED"
          ? ("ORIGINAL_BUYER_ESCROW_UNWOUND" as const)
          : ("ORIGINAL_BUYER" as const),
    };
  }

  /** Đánh dấu hoàn sơ cấp (phase 1: ledger only, chưa chi PayOS). */
  static async markPrimaryRefund(ticketId: number, note?: string) {
    const eligibility = await this.eligiblePrimaryRefund(ticketId);
    if (!eligibility.eligible) {
      throw Object.assign(new Error(eligibility.message), {
        status: 409,
        code: eligibility.reason,
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket?.originalOrderId) {
      throw Object.assign(new Error("Vé không gắn Order sơ cấp"), { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await this.recordLedger({
        ticketId,
        userId: eligibility.beneficiaryUserId,
        kind: "PRIMARY_REFUND",
        amount: eligibility.amount,
        refType: "order",
        refId: ticket.originalOrderId!,
        note: note ?? `primary_refund:${eligibility.source}`,
        tx,
      });

      await tx.order.update({
        where: { id: ticket.originalOrderId! },
        data: {
          primaryRefundStatus: "REFUNDED",
          primaryRefundBeneficiaryUserId: eligibility.beneficiaryUserId,
        },
      });
    });

    return eligibility;
  }
}
