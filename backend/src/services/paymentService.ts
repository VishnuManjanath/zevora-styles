import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { DeliveryEvent, DeliveryTracking } from "../models/Delivery.js";
import { Order, OrderItem } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Product, ProductVariant } from "../models/Product.js";
import { Notification } from "../models/Notification.js";
import { AuditLog } from "../models/Notification.js";
import { generateMockId, generateUnitSerial } from "../utils/helpers.js";
import { Errors } from "../utils/errors.js";

export async function initiatePayment(orderId: string, userId: string) {
  const order = await Order.findOne({ orderId, userId });
  if (!order) throw Errors.notFound("Order not found");

  const payment = await Payment.findOne({ orderId });
  if (!payment) throw Errors.notFound("Payment not found");
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

    const cart = await Cart.findOne({ userId: order.userId }).session(session);
    if (cart) {
      for (const cartItem of cart.items) {
        const variant = await ProductVariant.findById(cartItem.variantId).session(session);
        const product = await Product.findById(cartItem.productId).session(session);
        if (!variant || !product) continue;

        const unitPrice = variant.priceOverride ?? product.basePrice;

        for (let i = 0; i < cartItem.quantity; i++) {
          const unitSerial = generateUnitSerial(variant.serialPrefix);
          await OrderItem.create(
            [
              {
                orderId,
                productId: product._id,
                variantId: variant._id,
                productName: product.name,
                size: variant.size,
                sku: `${product.sku}${variant.skuSuffix}`,
                unitSerial,
                quantity: 1,
                unitPrice,
                lineTotal: unitPrice,
              },
            ],
            { session },
          );
        }

        variant.stock -= cartItem.quantity;
        await variant.save({ session });
      }

      cart.items = [];
      cart.updatedAt = new Date();
      await cart.save({ session });
    }

    await DeliveryTracking.create(
      [
        {
          orderId,
          carrier: "mock_delhivery",
          trackingId: generateMockId("DLV-MOCK"),
          status: "label_created",
        },
      ],
      { session },
    );

    await DeliveryEvent.create(
      [
        {
          orderId,
          status: "label_created",
          description: "Shipping label created",
          occurredAt: new Date(),
        },
      ],
      { session },
    );

    await Notification.create(
      [
        {
          userId: order.userId,
          channel: "in_app",
          template: "order_confirmed",
          title: "Order confirmed",
          body: `Your order ${orderId} has been confirmed.`,
          sentAt: new Date(),
        },
        {
          userId: order.userId,
          channel: "sms_mock",
          template: "order_confirmed",
          title: "SMS",
          body: `Zevora Styles: Order ${orderId} confirmed. Amount Rs ${order.total / 100}.`,
          sentAt: new Date(),
        },
      ],
      { session },
    );

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
