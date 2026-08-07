import type { Types } from "mongoose";
import { randomBytes } from "crypto";
import {
  Dispute,
  DisputeEvidence,
  DisputeMessage,
  type ClaimType,
} from "../models/Dispute.js";
import { Order, OrderItem } from "../models/Order.js";
import { PolicyConfig } from "../models/Policy.js";
import { generateHitlToken } from "../utils/helpers.js";
import { Errors } from "../utils/errors.js";

export async function openDispute(
  userId: Types.ObjectId,
  data: {
    orderId: string;
    claimType: ClaimType;
    description: string;
    orderItemId?: string;
  },
) {
  const order = await Order.findOne({ orderId: data.orderId, userId });
  if (!order) throw Errors.notFound("Order not found");

  const policy = await PolicyConfig.findOne({ key: "default" });
  if (policy && !policy.enabledClaimTypes.includes(data.claimType)) {
    throw Errors.badRequest("CLAIM_TYPE_DISABLED", "This claim type is not enabled");
  }

  if (data.claimType !== "delivery_delay" && order.status !== "delivered") {
    throw Errors.badRequest(
      "DISPUTE_NOT_ELIGIBLE",
      "Dispute can only be opened on delivered orders for this claim type",
    );
  }

  if (order.deliveredAt && policy) {
    const windowEnd =
      order.deliveredAt.getTime() + policy.returnWindowDays * 24 * 60 * 60 * 1000;
    if (Date.now() > windowEnd && data.claimType !== "delivery_delay") {
      throw Errors.badRequest("DISPUTE_NOT_ELIGIBLE", "Return window has expired");
    }
  }

  const existing = await Dispute.findOne({
    orderId: data.orderId,
    userId,
    status: { $nin: ["closed", "rejected"] },
  });
  if (existing) {
    throw Errors.badRequest("DISPUTE_EXISTS", "An open dispute already exists for this order");
  }

  const dispute = await Dispute.create({
    orderId: data.orderId,
    userId,
    orderItemId: data.orderItemId,
    claimType: data.claimType,
    description: data.description,
    status: "opened",
    openedAt: new Date(),
  });

  await DisputeMessage.create({
    disputeId: dispute._id,
    sender: "customer",
    body: data.description,
  });

  await DisputeMessage.create({
    disputeId: dispute._id,
    sender: "system",
    body: "Your dispute has been opened. Our team will review your case.",
  });

  return dispute;
}

export async function listUserDisputes(userId: Types.ObjectId) {
  const disputes = await Dispute.find({ userId }).sort({ createdAt: -1 }).lean();
  return disputes.map((d) => ({ ...d, id: String(d._id) }));
}

export async function getDisputeDetail(disputeId: string, userId?: Types.ObjectId) {
  const query: Record<string, unknown> = { _id: disputeId };
  if (userId) query.userId = userId;

  const dispute = await Dispute.findOne(query).lean();
  if (!dispute) throw Errors.notFound("Dispute not found");

  const messages = await DisputeMessage.find({ disputeId: dispute._id })
    .sort({ createdAt: 1 })
    .lean();
  const evidence = await DisputeEvidence.find({ disputeId: dispute._id }).lean();

  return {
    ...dispute,
    id: String(dispute._id),
    messages: messages.map((m) => ({ ...m, id: String(m._id) })),
    evidence: evidence.map((e) => ({ ...e, id: String(e._id) })),
  };
}

export async function addDisputeMessage(
  disputeId: string,
  userId: Types.ObjectId,
  body: string,
) {
  const dispute = await Dispute.findOne({ _id: disputeId, userId });
  if (!dispute) throw Errors.notFound("Dispute not found");

  const message = await DisputeMessage.create({
    disputeId: dispute._id,
    sender: "customer",
    body,
  });

  return message;
}

export async function createCaptureSession(disputeId: string, userId: Types.ObjectId) {
  const dispute = await Dispute.findOne({ _id: disputeId, userId });
  if (!dispute) throw Errors.notFound("Dispute not found");

  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  return {
    disputeId: String(dispute._id),
    sessionNonce: nonce,
    expiresAt,
    challenge: "Show the damage, then rotate to show the price tag in the same frame",
  };
}

export async function hitlApprove(disputeId: string, adminId: Types.ObjectId) {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) throw Errors.notFound("Dispute not found");

  const token = generateHitlToken();
  dispute.hitlApproved = true;
  dispute.hitlApprovalToken = token;
  dispute.status = "approved";
  await dispute.save();

  return { dispute, hitlApprovalToken: token };
}

export async function hitlReject(disputeId: string) {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) throw Errors.notFound("Dispute not found");

  dispute.status = "rejected";
  dispute.resolvedAt = new Date();
  await dispute.save();

  return dispute;
}
