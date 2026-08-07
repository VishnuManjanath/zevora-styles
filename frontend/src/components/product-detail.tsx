"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { formatPrice, imageUrl } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";
import { clsx } from "clsx";

export function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants.find((v) => v.stock > 0)?.id || product.variants[0]?.id,
  );
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const variant = product.variants.find((v) => v.id === selectedVariant);
  const images = product.images?.length
    ? product.images
    : [{ url: "", alt: product.name, sort: 0 }];

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.basePrice
      ? Math.round(
          ((product.compareAtPrice - product.basePrice) /
            product.compareAtPrice) *
            100,
        )
      : null;

  async function handleAdd() {
    if (!variant) return;
    setAdding(true);
    try {
      await addItem(variant.id, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  }

  async function handleBuyNow() {
    await handleAdd();
    router.push("/cart");
  }

  return (
    <div className="container-page py-12">
      <nav className="mb-8 text-xs text-ink-500">
        <Link href="/shop" className="hover:text-ink-900">Shop</Link>
        {product.category && (
          <>
            {" / "}
            <Link href={`/shop/${product.category.slug}`} className="hover:text-ink-900">
              {product.category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-ink-800">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream-200">
            {images[activeImage]?.url && (
              <Image
                src={imageUrl(images[activeImage].url)}
                alt={product.name}
                fill
                priority
                className="object-cover"
              />
            )}
            {discount && (
              <span className="absolute left-4 top-4 rounded-full bg-terracotta-500 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                -{discount}% Off
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={clsx(
                    "relative h-20 w-16 flex-none overflow-hidden rounded-lg border-2 transition-colors",
                    activeImage === i
                      ? "border-terracotta-500"
                      : "border-transparent",
                  )}
                >
                  <Image src={imageUrl(img.url)} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="eyebrow mb-2">{product.category?.name}</p>
          <h1 className="font-display text-[38px] leading-tight text-ink-900">
            {product.name}
          </h1>
          <p className="mt-1 text-xs uppercase tracking-wide text-ink-400">
            SKU {product.sku}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <span className="font-display text-3xl text-ink-900">
              {formatPrice(variant?.price ?? product.basePrice)}
            </span>
            {product.compareAtPrice && (
              <span className="text-base text-ink-400 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink-600">
              {product.description}
            </p>
          )}

          {/* Size selector */}
          <div className="mt-8">
            <p className="label-field">Select Size</p>
            <div className="flex flex-wrap gap-2.5">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  disabled={v.stock === 0}
                  onClick={() => setSelectedVariant(v.id)}
                  className={clsx(
                    "flex h-11 min-w-[52px] items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors",
                    v.stock === 0
                      ? "cursor-not-allowed border-ink-900/10 text-ink-400 line-through"
                      : selectedVariant === v.id
                      ? "border-ink-900 bg-ink-900 text-cream-50"
                      : "border-ink-900/15 text-ink-800 hover:border-ink-900/40",
                  )}
                >
                  {v.size}
                </button>
              ))}
            </div>
            {variant && variant.stock > 0 && variant.stock <= 5 && (
              <p className="mt-2 text-xs text-terracotta-600">
                Only {variant.stock} left in this size
              </p>
            )}
          </div>

          {/* Quantity + Add to cart */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-full border border-ink-900/15">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center text-ink-700 hover:text-terracotta-600"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(variant?.stock || 10, q + 1))}
                className="flex h-11 w-11 items-center justify-center text-ink-700 hover:text-terracotta-600"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={adding || !variant || variant.stock === 0}
              className="btn-secondary flex-1 sm:flex-none"
            >
              {added ? "Added ✓" : adding ? "Adding…" : "Add To Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={adding || !variant || variant.stock === 0}
              className="btn-primary flex-1 sm:flex-none"
            >
              Buy Now
            </button>
          </div>

          {variant?.stock === 0 && (
            <p className="mt-3 text-sm text-red-500">This size is out of stock.</p>
          )}

          {/* Trust row */}
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-ink-900/[0.08] pt-8">
            {[
              { icon: Truck, label: "Free shipping over ₹1,499" },
              { icon: Undo2, label: "7-day easy returns" },
              { icon: ShieldCheck, label: "Secure checkout" },
            ].map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-2 text-center">
                <t.icon size={18} className="text-terracotta-500" />
                <p className="text-[11px] leading-snug text-ink-500">{t.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
