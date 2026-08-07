import type { Types } from "mongoose";
import { Cart } from "../models/Cart.js";
import { Product, ProductVariant } from "../models/Product.js";
import { Errors } from "../utils/errors.js";

async function findOrCreateCart(userId?: Types.ObjectId, sessionId?: string) {
  if (userId) {
    let cart = await Cart.findOne({ userId });
    if (!cart) cart = await Cart.create({ userId, items: [] });
    return cart;
  }
  if (sessionId) {
    let cart = await Cart.findOne({ sessionId });
    if (!cart) cart = await Cart.create({ sessionId, items: [] });
    return cart;
  }
  throw Errors.badRequest("NO_CART", "User or session required");
}

export async function getCart(userId?: Types.ObjectId, sessionId?: string) {
  const cart = await findOrCreateCart(userId, sessionId);
  return await enrichCart(cart);
}

async function enrichCart(cart: InstanceType<typeof Cart>) {
  const items = await Promise.all(
    cart.items.map(async (item) => {
      const variant = await ProductVariant.findById(item.variantId).lean();
      const product = await Product.findById(item.productId).lean();
      if (!variant || !product) return null;
      const price = variant.priceOverride ?? product.basePrice;
      return {
        id: String(item.variantId),
        variantId: String(item.variantId),
        productId: String(item.productId),
        quantity: item.quantity,
        product: {
          sku: product.sku,
          name: product.name,
          images: product.images,
        },
        size: variant.size,
        price,
        lineTotal: price * item.quantity,
        inStock: variant.stock >= item.quantity,
      };
    }),
  );

  const validItems = items.filter(Boolean) as NonNullable<Awaited<ReturnType<typeof items[number]>>>[];
  const subtotal = validItems.reduce((sum, i) => sum + i.lineTotal, 0);

  return {
    id: String(cart._id),
    items: validItems,
    subtotal,
    itemCount: validItems.reduce((sum, i) => sum + i.quantity, 0),
  };
}

export async function addToCart(
  userId?: Types.ObjectId,
  sessionId?: string,
  variantId: string,
  quantity: number,
) {
  const variant = await ProductVariant.findById(variantId);
  if (!variant) throw Errors.notFound("Variant not found");
  if (variant.stock < quantity) {
    throw Errors.badRequest("INSUFFICIENT_STOCK", "Not enough stock");
  }

  const cart = await findOrCreateCart(userId, sessionId);
  const existing = cart.items.find((i) => String(i.variantId) === variantId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({
      variantId: variant._id,
      productId: variant.productId,
      quantity,
      addedAt: new Date(),
    });
  }

  cart.updatedAt = new Date();
  await cart.save();
  return await enrichCart(cart);
}

export async function updateCartItem(
  userId?: Types.ObjectId,
  sessionId?: string,
  variantId: string,
  quantity: number,
) {
  const cart = await findOrCreateCart(userId, sessionId);
  const item = cart.items.find((i) => String(i.variantId) === variantId);
  if (!item) throw Errors.notFound("Cart item not found");

  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => String(i.variantId) !== variantId);
  } else {
    const variant = await ProductVariant.findById(variantId);
    if (!variant || variant.stock < quantity) {
      throw Errors.badRequest("INSUFFICIENT_STOCK", "Not enough stock");
    }
    item.quantity = quantity;
  }

  cart.updatedAt = new Date();
  await cart.save();
  return await enrichCart(cart);
}

export async function removeCartItem(
  userId?: Types.ObjectId,
  sessionId?: string,
  variantId: string,
) {
  const cart = await findOrCreateCart(userId, sessionId);
  cart.items = cart.items.filter((i) => String(i.variantId) !== variantId);
  cart.updatedAt = new Date();
  await cart.save();
  return await enrichCart(cart);
}

export async function clearCart(userId?: Types.ObjectId, sessionId?: string) {
  const cart = await findOrCreateCart(userId, sessionId);
  cart.items = [];
  cart.updatedAt = new Date();
  await cart.save();
  return await enrichCart(cart);
}

export async function mergeGuestCart(userId: Types.ObjectId, sessionId: string) {
  const guestCart = await Cart.findOne({ sessionId });
  if (!guestCart || guestCart.items.length === 0) return;

  let userCart = await Cart.findOne({ userId });
  if (!userCart) {
    guestCart.userId = userId;
    guestCart.sessionId = undefined;
    await guestCart.save();
    return;
  }

  for (const guestItem of guestCart.items) {
    const existing = userCart.items.find(
      (i) => String(i.variantId) === String(guestItem.variantId),
    );
    if (existing) {
      existing.quantity += guestItem.quantity;
    } else {
      userCart.items.push(guestItem);
    }
  }

  userCart.updatedAt = new Date();
  await userCart.save();
  await Cart.deleteOne({ _id: guestCart._id });
}
