"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { api } from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import { clsx } from "clsx";

const SORTS = [
  { value: "", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A–Z" },
];

export function ShopGrid({
  initialProducts,
  categories,
  activeCategory,
}: {
  initialProducts: Product[];
  categories: Category[];
  activeCategory?: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [sort, setSort] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  async function applySort(value: string) {
    setSort(value);
    setSortOpen(false);
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (activeCategory) qs.set("category", activeCategory);
      if (value) qs.set("sort", value);
      const res = await api<{ products: Product[] }>(
        `/api/catalog/products?${qs.toString()}`,
        { auth: false },
      );
      setProducts(res.products);
    } finally {
      setLoading(false);
    }
  }

  const currentSortLabel = SORTS.find((s) => s.value === sort)?.label;

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-ink-900/[0.08] pb-6">
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/shop"
            className={clsx(
              "rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors",
              !activeCategory
                ? "bg-ink-900 text-cream-50"
                : "bg-cream-200 text-ink-700 hover:bg-cream-300",
            )}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop/${c.slug}`}
              className={clsx(
                "rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors",
                activeCategory === c.slug
                  ? "bg-ink-900 text-cream-50"
                  : "bg-cream-200 text-ink-700 hover:bg-cream-300",
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setSortOpen((s) => !s)}
            className="flex items-center gap-2 rounded-full border border-ink-900/10 px-4 py-2 text-xs font-medium text-ink-700"
          >
            Sort: {currentSortLabel || "Newest"}
            <ChevronDown size={14} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-ink-900/[0.08] bg-white shadow-card">
              {SORTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => applySort(s.value)}
                  className={clsx(
                    "block w-full px-4 py-2.5 text-left text-sm hover:bg-cream-100",
                    sort === s.value && "text-terracotta-600",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-ink-400">Loading…</div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-900/15 py-24 text-center text-ink-500">
          No products found in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
