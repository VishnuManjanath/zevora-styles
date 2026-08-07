import type { Types } from "mongoose";
import mongoose from "mongoose";
import { Order, OrderItem } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { ProductVariant } from "../models/Product.js";
import {
  InventoryMovement,
  PayoutLink,
  ReturnPickup,
} from "../models/Supplemental.js";
import { Dispute } from "../models/Dispute.js";
import { AuditLog } from "../models/Notification.js";
import { generateMockId } from "../utils/helpers.js";
import { Errors } from "../utils/errors.js";

export async function cancelOrder(orderId: string, userId: Types.ObjectId) {
  const order = await Order.findOne({ orderId, userId });
  if (!order) throw Errors.notFound("Order not found");

  const cancellable = ["pending", "confirmed", "processing"];
  if (!cancellable.includes(order.status)) {
    throw Errors.badRequest(
      "ORDER_NOT_CANCELLABLE",
      "Order cannot be cancelled at this stage",
    );
  }

  if (order.paymentStatus === "paid") {
    throw Errors.badRequest(
      "ORDER_NOT_CANCELLABLE",
      "Paid orders cannot be cancelled online — open a dispute instead",
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const items = await OrderItem.find({ orderId }).session(session);
    if (items.length > 0) {
      for (const item of items) {
        const variant = await ProductVariant.findById(item.variantId).session(session);
        if (variant) {
          variant.stock += item.quantity;
          await variant.save({ session });
          await InventoryMovement.create(
            [
              {
                variantId: variant._id,
                delta: item.quantity,
                reason: "order_cancelled",
                referenceId: orderId,
              },
            ],
            { session },
          );
        }
      }
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();
    await order.save({ session });

    const payment = await Payment.findOne({ orderId }).session(session);
    if (payment && payment.status === "pending") {
      payment.status = "failed";
      payment.failureReason = "Order cancelled by customer";
      await payment.save({ session });
    }

    await AuditLog.create(
      [
        {
          actorType: "user",
          actorId: String(userId),
          entityType: "order",
          entityId: orderId,
          action: "order_cancelled",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function createReturnPickup(data: {
  orderId: string;
  disputeId?: string;
  scheduledAt?: Date;
  addressSnapshot?: Record<string, unknown>;
}) {
  const order = await Order.findOne({ orderId: data.orderId });
  if (!order) throw Errors.notFound("Order not found");

  const pickup = await ReturnPickup.create({
    orderId: data.orderId,
    disputeId: data.disputeId,
    status: "scheduled",
    scheduledAt: data.scheduledAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
    addressSnapshot: data.addressSnapshot ?? order.addressSnapshot,
    mockPickupId: generateMockId("PICKUP-MOCK"),
  });

  return pickup;
}

export async function restockItem(data: {
  variantId: string;
  quantity: number;
  reason?: string;
  referenceId?: string;
}) {
  const variant = await ProductVariant.findById(data.variantId);
  if (!variant) throw Errors.notFound("Variant not found");

  variant.stock += data.quantity;
  await variant.save();

  const movement = await InventoryMovement.create({
    variantId: variant._id,
    delta: data.quantity,
    reason: data.reason ?? "restock",
    referenceId: data.referenceId,
  });

  return { variant, movement };
}

export async function createPayoutLink(data: {
  userId: string;
  orderId: string;
  disputeId?: string;
  amount: number;
  upiId?: string;
}) {
  const order = await Order.findOne({ orderId: data.orderId });
  if (!order) throw Errors.notFound("Order not found");

  const mockId = generateMockId("paylink");
  const link = await PayoutLink.create({
    userId: data.userId,
    orderId: data.orderId,
    disputeId: data.disputeId,
    amount: data.amount,
    upiId: data.upiId,
    mockLinkUrl: `https://mock.zevora/pay/${mockId}`,
    status: "pending",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  if (data.disputeId) {
    await Dispute.findByIdAndUpdate(data.disputeId, {
      outcome: "refund_full",
      outcomeAmount: data.amount,
    });
  }

  return link;
}
