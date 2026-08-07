import type { Types } from "mongoose";
import { DeliveryEvent, DeliveryTracking } from "../models/Delivery.js";
import { Order, OrderItem } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { Errors } from "../utils/errors.js";

export async function listUserOrders(userId: Types.ObjectId) {
  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  return orders.map((o) => ({
    ...o,
    id: o.orderId,
  }));
}

export async function getOrderDetail(orderId: string, userId?: Types.ObjectId) {
  const query: Record<string, unknown> = { orderId };
  if (userId) query.userId = userId;

  const order = await Order.findOne(query).lean();
  if (!order) throw Errors.notFound("Order not found");

  const items = await OrderItem.find({ orderId }).lean();
  const payment = await Payment.findOne({ orderId }).lean();
  const tracking = await DeliveryTracking.findOne({ orderId }).lean();
  const events = await DeliveryEvent.find({ orderId })
    .sort({ occurredAt: 1 })
    .lean();

  return {
    ...order,
    id: order.orderId,
    items: items.map((i) => ({ ...i, id: String(i._id) })),
    payment,
    tracking,
    deliveryEvents: events,
  };
}

export async function getDeliveryTracking(orderId: string, userId: Types.ObjectId) {
  const order = await Order.findOne({ orderId, userId });
  if (!order) throw Errors.notFound("Order not found");

  const tracking = await DeliveryTracking.findOne({ orderId }).lean();
  const events = await DeliveryEvent.find({ orderId })
    .sort({ occurredAt: 1 })
    .lean();

  return { tracking, events };
}

export async function getOrderForResolvr(orderId: string) {
  const order = await Order.findOne({ orderId }).lean();
  if (!order) throw Errors.notFound("Order not found");

  const items = await OrderItem.find({ orderId }).lean();
  const payment = await Payment.findOne({ orderId }).lean();
  const user = await User.findById(order.userId).lean();

  return {
    order: { ...order, id: order.orderId },
    items: items.map((i) => ({
      id: String(i._id),
      productName: i.productName,
      sku: i.sku,
      unitSerial: i.unitSerial,
      size: i.size,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    payment,
    customer: user
      ? {
          id: String(user._id),
          email: user.email,
          name: user.name,
          phone: user.phone,
        }
      : null,
  };
}

export async function getCustomerHistory(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw Errors.notFound("Customer not found");

  const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
  const { Dispute } = await import("../models/Dispute.js");
  const disputes = await Dispute.find({ userId: user._id }).sort({ createdAt: -1 }).lean();

  const accountAgeDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    customer: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      phone: user.phone,
      accountAgeDays,
    },
    orderCount: orders.length,
    disputeCount: disputes.length,
    orders: orders.map((o) => ({
      orderId: o.orderId,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
    })),
    disputes: disputes.map((d) => ({
      id: String(d._id),
      orderId: d.orderId,
      claimType: d.claimType,
      status: d.status,
      createdAt: d.createdAt,
    })),
  };
}
