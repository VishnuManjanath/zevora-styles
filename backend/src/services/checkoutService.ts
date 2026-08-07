import type { Types } from "mongoose";
import { Address } from "../models/Address.js";
import { StoreConfig } from "../models/Policy.js";
import { Product, ProductVariant } from "../models/Product.js";
import { Cart } from "../models/Cart.js";
import { Order, OrderItem } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
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
  };
}

export async function createOrder(userId: Types.ObjectId, addressId: string) {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw Errors.notFound("Address not found");

  const preview = await previewCheckout(userId, addressId);
  const orderId = generateOrderId();

  const order = await Order.create({
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
  });

  await Payment.create({
    orderId,
    amount: preview.total,
    method: "razorpay_mock",
    status: "pending",
  });

  return { order, preview };
}
