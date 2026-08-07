import mongoose from "mongoose";
import type { Types } from "mongoose";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { AuditLog } from "../models/Notification.js";
import {
  fulfillOrderFromCart,
  seedDeliveryForOrder,
  notifyOrderConfirmed,
} from "./orderFulfillmentService.js";
import { generateMockId } from "../utils/helpers.js";
import { Errors } from "../utils/errors.js";

export async function initiatePayment(orderId: string, userId: string) {
  const order = await Order.findOne({ orderId, userId });
  if (!order) throw Errors.notFound("Order not found");

  const payment = await Payment.findOne({ orderId });
  if (!payment) throw Errors.notFound("Payment not found");
  if (payment.method === "cod") {
    throw Errors.badRequest("COD_ORDER", "COD orders do not require online payment");
  }
  if (payment.status === "paid") {
    throw Errors.badRequest("PAYMENT_ALREADY_PAID", "Order already paid");
  }

  payment.razorpayOrderId = generateMockId("order_MOCK");
  await payment.save();

  return {
    orderId,
    amount: payment.amount,
    razorpayOrderId: payment.razorpayOrderId,
    key: "rzp_mock_key",
    currency: "INR",
  };
}

export async function confirmMockPayment(
  orderId: string,
  userId: string,
  success: boolean,
) {
  const order = await Order.findOne({ orderId, userId });
  if (!order) throw Errors.notFound("Order not found");

  const payment = await Payment.findOne({ orderId });
  if (!payment) throw Errors.notFound("Payment not found");
  if (payment.method === "cod") {
    throw Errors.badRequest("COD_ORDER", "Use COD flow — order already confirmed");
  }
  if (payment.status === "paid") {
    throw Errors.badRequest("PAYMENT_ALREADY_PAID", "Order already paid");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!success) {
      payment.status = "failed";
      payment.failureReason = "User cancelled or payment failed";
      order.paymentStatus = "failed";
      await payment.save({ session });
      await order.save({ session });
      await session.commitTransaction();
      return { success: false, orderId, status: order.status };
    }

    payment.status = "paid";
    payment.razorpayPaymentId = generateMockId("pay_MOCK");
    payment.paidAt = new Date();
    order.status = "confirmed";
    order.paymentStatus = "paid";

    await fulfillOrderFromCart(orderId, order.userId, session);
    await seedDeliveryForOrder(orderId, session);
    await notifyOrderConfirmed(order.userId, orderId, order.total, session);

    await AuditLog.create(
      [
        {
          actorType: "system",
          entityType: "order",
          entityId: orderId,
          action: "payment_confirmed",
          payload: { amount: payment.amount },
        },
      ],
      { session },
    );

    await payment.save({ session });
    await order.save({ session });
    await session.commitTransaction();

    return {
      success: true,
      orderId,
      status: order.status,
      paymentId: payment.razorpayPaymentId,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function confirmCodOrder(orderId: string, userId: Types.ObjectId) {
  const order = await Order.findOne({ orderId, userId });
  if (!order) throw Errors.notFound("Order not found");

  const payment = await Payment.findOne({ orderId });
  if (!payment) throw Errors.notFound("Payment not found");
  if (payment.method !== "cod") {
    throw Errors.badRequest("NOT_COD_ORDER", "Order is not COD");
  }
  if (order.status !== "pending") {
    throw Errors.badRequest("ORDER_ALREADY_CONFIRMED", "Order already processed");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    order.status = "confirmed";
    order.paymentStatus = "pending";

    await fulfillOrderFromCart(orderId, userId, session);
    await seedDeliveryForOrder(orderId, session);
    await notifyOrderConfirmed(userId, orderId, order.total, session);

    await AuditLog.create(
      [
        {
          actorType: "system",
          entityType: "order",
          entityId: orderId,
          action: "cod_order_confirmed",
          payload: { amount: payment.amount },
        },
      ],
      { session },
    );

    await order.save({ session });
    await session.commitTransaction();

    return { success: true, orderId, status: order.status, paymentMethod: "cod" };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
