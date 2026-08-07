import type { ClientSession, Types } from "mongoose";
import { Cart } from "../models/Cart.js";
import { DeliveryEvent, DeliveryTracking } from "../models/Delivery.js";
import { Order, OrderItem } from "../models/Order.js";
import { Product, ProductVariant } from "../models/Product.js";
import { Notification } from "../models/Notification.js";
import { InventoryMovement } from "../models/Supplemental.js";
import { generateMockId, generateUnitSerial } from "../utils/helpers.js";

export async function fulfillOrderFromCart(
  orderId: string,
  userId: Types.ObjectId,
  session: ClientSession,
): Promise<void> {
  const existingItems = await OrderItem.countDocuments({ orderId }).session(session);
  if (existingItems > 0) return;

  const cart = await Cart.findOne({ userId }).session(session);
  if (!cart || cart.items.length === 0) return;

  for (const cartItem of cart.items) {
    const variant = await ProductVariant.findById(cartItem.variantId).session(session);
    const product = await Product.findById(cartItem.productId).session(session);
    if (!variant || !product) continue;

    const unitPrice = variant.priceOverride ?? product.basePrice;

    for (let i = 0; i < cartItem.quantity; i++) {
      await OrderItem.create(
        [
          {
            orderId,
            productId: product._id,
            variantId: variant._id,
            productName: product.name,
            size: variant.size,
            sku: `${product.sku}${variant.skuSuffix}`,
            unitSerial: generateUnitSerial(variant.serialPrefix),
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

    await InventoryMovement.create(
      [
        {
          variantId: variant._id,
          delta: -cartItem.quantity,
          reason: "order_fulfillment",
          referenceId: orderId,
        },
      ],
      { session },
    );
  }

  cart.items = [];
  cart.updatedAt = new Date();
  await cart.save({ session });
}

export async function seedDeliveryForOrder(
  orderId: string,
  session: ClientSession,
): Promise<void> {
  const existing = await DeliveryTracking.findOne({ orderId }).session(session);
  if (existing) return;

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
}

export async function notifyOrderConfirmed(
  userId: Types.ObjectId,
  orderId: string,
  total: number,
  session: ClientSession,
): Promise<void> {
  await Notification.create(
    [
      {
        userId,
        channel: "in_app",
        template: "order_confirmed",
        title: "Order confirmed",
        body: `Your order ${orderId} has been confirmed.`,
        sentAt: new Date(),
      },
      {
        userId,
        channel: "sms_mock",
        template: "order_confirmed",
        title: "SMS",
        body: `Zevora Styles: Order ${orderId} confirmed. Amount Rs ${total / 100}.`,
        sentAt: new Date(),
      },
    ],
    { session },
  );
}

export async function restoreStockForOrder(
  orderId: string,
  session: ClientSession,
): Promise<void> {
  const items = await OrderItem.find({ orderId }).session(session);

  for (const item of items) {
    const variant = await ProductVariant.findById(item.variantId).session(session);
    if (!variant) continue;

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
