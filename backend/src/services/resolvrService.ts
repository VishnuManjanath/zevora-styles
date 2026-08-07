import mongoose from "mongoose";
import { Dispute } from "../models/Dispute.js";
import { Order } from "../models/Order.js";
import { Payment, RefundTransaction } from "../models/Payment.js";
import { PolicyClause, PolicyConfig } from "../models/Policy.js";
import { Notification, AuditLog } from "../models/Notification.js";
import { generateMockId } from "../utils/helpers.js";
import { Errors } from "../utils/errors.js";

export async function getPolicyPack() {
  const config = await PolicyConfig.findOne({ key: "default" });
  const clauses = await PolicyClause.find({ isActive: true }).lean();

  return {
    config: config
      ? {
          autoResolveCap: config.autoResolveCap,
          enabledClaimTypes: config.enabledClaimTypes,
          returnWindowDays: config.returnWindowDays,
          policyPackVersion: config.policyPackVersion,
        }
      : null,
    clauses: clauses.map((c) => ({
      clauseId: c.clauseId,
      title: c.title,
      body: c.body,
      category: c.category,
      version: c.version,
    })),
  };
}

export async function issueRefund(data: {
  orderId: string;
  amount: number;
  disputeId?: string;
  clauseId?: string;
  idempotencyKey: string;
  hitlApprovalToken?: string;
  reason?: string;
}) {
  const existing = await RefundTransaction.findOne({
    idempotencyKey: data.idempotencyKey,
  });
  if (existing) {
    return { refund: existing, replay: true };
  }

  if (data.clauseId) {
    const clause = await PolicyClause.findOne({
      clauseId: data.clauseId,
      isActive: true,
    });
    if (!clause) throw Errors.guardrailClause();
  }

  const order = await Order.findOne({ orderId: data.orderId });
  if (!order) throw Errors.notFound("Order not found");

  const completedRefunds = await RefundTransaction.find({
    orderId: data.orderId,
    status: "completed",
  });
  const refundedSoFar = completedRefunds.reduce((sum, r) => sum + r.amount, 0);
  const refundable = order.total - refundedSoFar;

  if (data.amount > refundable) throw Errors.guardrailAmount();

  const policy = await PolicyConfig.findOne({ key: "default" });
  const cap = policy?.autoResolveCap ?? 80000;

  let dispute = null;
  if (data.disputeId) {
    dispute = await Dispute.findById(data.disputeId);
  }

  if (data.amount > cap) {
    const tokenValid =
      data.hitlApprovalToken &&
      dispute?.hitlApproved &&
      dispute.hitlApprovalToken === data.hitlApprovalToken;

    if (!tokenValid) {
      throw Errors.guardrailCap();
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const refund = await RefundTransaction.create(
      [
        {
          orderId: data.orderId,
          disputeId: data.disputeId,
          amount: data.amount,
          status: "completed",
          reason: data.reason,
          mockRefundId: generateMockId("rfnd_MOCK"),
          idempotencyKey: data.idempotencyKey,
          hitlApproved: data.amount > cap,
          clauseId: data.clauseId,
          completedAt: new Date(),
        },
      ],
      { session },
    );

    const refundDoc = refund[0];

    const newRefundedTotal = refundedSoFar + data.amount;
    if (newRefundedTotal >= order.total) {
      order.paymentStatus = "refunded";
      order.status = "refunded";
    } else {
      order.paymentStatus = "partial_refund";
    }
    await order.save({ session });

    const payment = await Payment.findOne({ orderId: data.orderId }).session(session);
    if (payment && payment.status === "paid") {
      // payment record stays paid; refunds tracked separately
    }

    if (dispute) {
      dispute.status = "auto_resolved";
      dispute.outcome = data.amount >= order.total ? "refund_full" : "refund_partial";
      dispute.outcomeAmount = data.amount;
      dispute.resolvedAt = new Date();
      await dispute.save({ session });
    }

    await Notification.create(
      [
        {
          userId: order.userId,
          channel: "in_app",
          template: "refund_completed",
          title: "Refund processed",
          body: `Refund of Rs ${data.amount / 100} for order ${data.orderId} has been processed.`,
          sentAt: new Date(),
        },
        {
          userId: order.userId,
          channel: "sms_mock",
          template: "refund_completed",
          title: "SMS",
          body: `Zevora Styles: Refund Rs ${data.amount / 100} for ${data.orderId} credited.`,
          sentAt: new Date(),
        },
      ],
      { session },
    );

    await AuditLog.create(
      [
        {
          actorType: "resolvr",
          entityType: "refund",
          entityId: String(refundDoc._id),
          action: "refund_issued",
          payload: {
            orderId: data.orderId,
            amount: data.amount,
            clauseId: data.clauseId,
            idempotencyKey: data.idempotencyKey,
          },
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return { refund: refundDoc, replay: false };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function adminIssueRefund(data: {
  orderId: string;
  amount: number;
  clauseId?: string;
  idempotencyKey: string;
  reason?: string;
  adminId?: string;
}) {
  if (data.clauseId) {
    const clause = await PolicyClause.findOne({
      clauseId: data.clauseId,
      isActive: true,
    });
    if (!clause) throw Errors.guardrailClause();
  }

  const existing = await RefundTransaction.findOne({
    idempotencyKey: data.idempotencyKey,
  });
  if (existing) return { refund: existing, replay: true };

  const order = await Order.findOne({ orderId: data.orderId });
  if (!order) throw Errors.notFound("Order not found");

  const completedRefunds = await RefundTransaction.find({
    orderId: data.orderId,
    status: "completed",
  });
  const refundedSoFar = completedRefunds.reduce((sum, r) => sum + r.amount, 0);
  if (data.amount > order.total - refundedSoFar) throw Errors.guardrailAmount();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const refund = await RefundTransaction.create(
      [
        {
          orderId: data.orderId,
          amount: data.amount,
          status: "completed",
          reason: data.reason,
          mockRefundId: generateMockId("rfnd_MOCK"),
          idempotencyKey: data.idempotencyKey,
          hitlApproved: true,
          hitlApprovedBy: data.adminId,
          hitlApprovedAt: new Date(),
          clauseId: data.clauseId,
          completedAt: new Date(),
        },
      ],
      { session },
    );

    const refundDoc = refund[0];
    const newRefundedTotal = refundedSoFar + data.amount;
    if (newRefundedTotal >= order.total) {
      order.paymentStatus = "refunded";
      order.status = "refunded";
    } else {
      order.paymentStatus = "partial_refund";
    }
    await order.save({ session });

    await Notification.create(
      [
        {
          userId: order.userId,
          channel: "in_app",
          template: "refund_completed",
          title: "Refund processed",
          body: `Refund of Rs ${data.amount / 100} for order ${data.orderId} has been processed.`,
          sentAt: new Date(),
        },
      ],
      { session },
    );

    await AuditLog.create(
      [
        {
          actorType: "user",
          actorId: data.adminId,
          entityType: "refund",
          entityId: String(refundDoc._id),
          action: "admin_refund_issued",
          payload: { orderId: data.orderId, amount: data.amount },
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return { refund: refundDoc, replay: false };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function createNotification(data: {
  userId: string;
  channel: "in_app" | "sms_mock" | "email_mock";
  template: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  const notification = await Notification.create({
    userId: data.userId,
    channel: data.channel,
    template: data.template,
    title: data.title,
    body: data.body,
    metadata: data.metadata,
    sentAt: new Date(),
  });

  return notification;
}
