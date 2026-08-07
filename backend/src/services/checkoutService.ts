import type { Types } from "mongoose";
import mongoose from "mongoose";
import { Address } from "../models/Address.js";
import { StoreConfig } from "../models/Policy.js";
import { Product, ProductVariant } from "../models/Product.js";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { AuditLog } from "../models/Notification.js";
import {
  fulfillOrderFromCart,
  seedDeliveryForOrder,
  notifyOrderConfirmed,
} from "./orderFulfillmentService.js";
import { generateOrderId } from "../utils/helpers.js";
import { Errors } from "../utils/errors.js";

export async function getStoreConfig() {
  let config = await StoreConfig.findOne({ key: "default" });
  if (!config) {
    config = await StoreConfig.create({ key: "default" });
  }
  return config;
}

export async function previewCheckout(userId: Types.ObjectId, addressId?: string) {
  const cart = await Cart.findOne({ userId });
  if (!cart || cart.items.length === 0) {
    throw Errors.badRequest("EMPTY_CART", "Cart is empty");
  }

  const store = await getStoreConfig();
  let subtotal = 0;
  const lines: Array<{
    variantId: string;
    productName: string;
    size: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }> = [];

  for (const item of cart.items) {
    const variant = await ProductVariant.findById(item.variantId);
    const product = await Product.findById(item.productId);
    if (!variant || !product) continue;

    if (variant.stock < item.quantity) {
      throw Errors.badRequest(
        "INSUFFICIENT_STOCK",
        `${product.name} (${variant.size}) is out of stock`,
      );
    }

    const unitPrice = variant.priceOverride ?? product.basePrice;
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    lines.push({
      variantId: String(variant._id),
      productName: product.name,
      size: variant.size,
      sku: `${product.sku}${variant.skuSuffix}`,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
    });
  }

  const shippingFee =
    subtotal >= store.freeShippingMin ? 0 : store.shippingFee;
  const total = subtotal + shippingFee;

  let address = null;
  if (addressId) {
    address = await Address.findOne({ _id: addressId, userId });
  }

  return {
    lines,
    subtotal,
    shippingFee,
    discount: 0,
    total,
    freeShippingMin: store.freeShippingMin,
    address,
    paymentMethods: ["razorpay_mock", "cod"],
  };
}

export async function createOrder(
  userId: Types.ObjectId,
  addressId: string,
  paymentMethod: "razorpay_mock" | "cod" = "razorpay_mock",
) {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw Errors.notFound("Address not found");

  const preview = await previewCheckout(userId, addressId);
  const orderId = generateOrderId();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.create(
      [
        {
          orderId,
          userId,
          status: "pending",
          paymentStatus: "pending",
          subtotal: preview.subtotal,
          shippingFee: preview.shippingFee,
          discount: 0,
          total: preview.total,
          addressSnapshot: {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            label: address.label,
          },
          promisedDeliveryAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
      ],
      { session },
    );

    await Payment.create(
      [
        {
          orderId,
          amount: preview.total,
          method: paymentMethod,
          status: "pending",
        },
      ],
      { session },
    );

    const orderDoc = order[0];

    if (paymentMethod === "cod") {
      orderDoc.status = "confirmed";
      orderDoc.paymentStatus = "pending";
      await fulfillOrderFromCart(orderId, userId, session);
      await seedDeliveryForOrder(orderId, session);
      await notifyOrderConfirmed(userId, orderId, orderDoc.total, session);

      await AuditLog.create(
        [
          {
            actorType: "system",
            entityType: "order",
            entityId: orderId,
            action: "cod_order_created",
            payload: { amount: preview.total },
          },
        ],
        { session },
      );

      await orderDoc.save({ session });
    }

    await session.commitTransaction();

    return {
      order: orderDoc,
      preview,
      paymentMethod,
      nextStep:
        paymentMethod === "cod"
          ? "order_confirmed"
          : "initiate_payment",
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
