"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { formatPrice, imageUrl } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";
import { clsx } from "clsx";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [wish, setWish] = useState(false);

  const image = product.images?.[0]?.url;
  const defaultVariant = product.variants?.[0];
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.basePrice
      ? Math.round(
          ((product.compareAtPrice - product.basePrice) /
            product.compareAtPrice) *
            100,
        )
      : null;

  async function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!defaultVariant) return;
    setAdding(true);
    try {
      await addItem(defaultVariant.id, 1);
    } finally {
      setAdding(false);
    }
  }

  return (
    <Link href={`/product/${product.sku}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-cream-200">
        {image && (
          <Image
            src={imageUrl(image)}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        )}

        {discount && (
          <span className="absolute left-3 top-3 rounded-full bg-terracotta-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            -{discount}%
          </span>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            setWish((w) => !w);
          }}
          aria-label="Save"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-700 opacity-0 shadow-soft transition-all duration-300 group-hover:opacity-100"
        >
          <Heart
            size={15}
            className={wish ? "fill-terracotta-500 text-terracotta-500" : ""}
          />
        </button>

        <button
          onClick={quickAdd}
          disabled={adding || !defaultVariant}
          className={clsx(
            "absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-full bg-ink-900/95 py-2.5 text-xs font-medium uppercase tracking-wide text-cream-50 opacity-0 shadow-lift backdrop-blur transition-all duration-300 group-hover:opacity-100",
            "translate-y-2 group-hover:translate-y-0",
          )}
        >
          <ShoppingBag size={13} />
          {adding ? "Adding…" : "Quick Add"}
        </button>
      </div>

      <div className="mt-3.5 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-[17px] leading-snug text-ink-900">
            {product.name}
          </h3>
          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-400">
            {product.category?.name}
          </p>
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-sm font-semibold text-ink-900">
          {formatPrice(product.basePrice)}
        </span>
        {product.compareAtPrice && (
          <span className="text-xs text-ink-400 line-through">
            {formatPrice(product.compareAtPrice)}
          </span>
        )}
      </div>
    </Link>
  );
}
