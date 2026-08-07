"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatPrice, imageUrl } from "@/lib/api";
import { PageLoader } from "@/components/ui/spinner";

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart();

  if (loading) return <PageLoader />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-24 text-center">
        <ShoppingBag size={40} className="mb-5 text-ink-300" />
        <h1 className="font-display text-3xl text-ink-900">Your Cart Is Empty</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-500">
          Looks like you haven&apos;t added anything yet. Explore our collection to find something you&apos;ll love.
        </p>
        <Link href="/shop" className="btn-primary mt-8">
          Continue Shopping
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const shippingFee = cart.subtotal >= 149900 ? 0 : 9900;
  const total = cart.subtotal + shippingFee;

  return (
    <div className="container-page py-14">
      <h1 className="font-display text-[38px] text-ink-900">Your Cart</h1>
      <p className="mt-1 text-sm text-ink-500">{cart.itemCount} item(s)</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-5 border-b border-ink-900/[0.08] pb-6"
            >
              <div className="relative h-28 w-24 flex-none overflow-hidden rounded-xl bg-cream-200">
                {item.product.images?.[0]?.url && (
                  <Image
                    src={imageUrl(item.product.images[0].url)}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg text-ink-900">
                      {item.product.name}
                    </h3>
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-400">
                      Size {item.size} · {item.product.sku}
                    </p>
                    {!item.inStock && (
                      <p className="mt-1 text-xs text-red-500">
                        Insufficient stock for this quantity
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="text-ink-400 hover:text-red-500"
                    aria-label="Remove"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-ink-900/15">
                    <button
                      onClick={() => updateItem(item.variantId, item.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center text-ink-700 hover:text-terracotta-600"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-7 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateItem(item.variantId, item.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center text-ink-700 hover:text-terracotta-600"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <p className="font-semibold text-ink-900">
                    {formatPrice(item.lineTotal)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card-surface h-fit p-7">
          <h2 className="font-display text-xl text-ink-900">Order Summary</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-ink-600">
              <span>Subtotal</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-600">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? "Free" : formatPrice(shippingFee)}</span>
            </div>
            {shippingFee > 0 && (
              <p className="text-xs text-terracotta-600">
                Add {formatPrice(149900 - cart.subtotal)} more for free shipping
              </p>
            )}
            <div className="flex justify-between border-t border-ink-900/[0.08] pt-3 text-base font-semibold text-ink-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <Link href="/checkout" className="btn-primary mt-6 w-full">
            Proceed To Checkout
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/shop"
            className="mt-3 block text-center text-xs font-medium uppercase tracking-wide text-ink-500 hover:text-ink-900"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
