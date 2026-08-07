"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, EyeOff, Eye } from "lucide-react";
import { api, formatPrice, imageUrl } from "@/lib/api";
import { PageLoader } from "@/components/ui/spinner";
import type { Product } from "@/lib/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await api<{ products: Product[] }>("/api/admin/products");
    setProducts(res.products);
  }

  async function toggleActive(product: Product) {
    if (product.isActive) {
      await api(`/api/admin/products/${product._id}`, { method: "DELETE" });
    } else {
      await api(`/api/admin/products/${product._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: true }),
      });
    }
    await load();
  }

  if (!products) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Products</h1>
          <p className="mt-1 text-sm text-ink-500">{products.length} total products</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="mt-8 card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-900/[0.08] bg-cream-100 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">SKU</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-b border-ink-900/[0.06] last:border-0">
                <td className="flex items-center gap-3 px-5 py-3">
                  {p.images?.[0]?.url && (
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-cream-200">
                      <Image src={imageUrl(p.images[0].url)} alt="" fill className="object-cover" />
                    </div>
                  )}
                  <span className="font-medium text-ink-900">{p.name}</span>
                </td>
                <td className="px-5 py-3 text-ink-500">{p.sku}</td>
                <td className="px-5 py-3 text-ink-500">—</td>
                <td className="px-5 py-3 text-ink-800">{formatPrice(p.basePrice)}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      p.isActive
                        ? "bg-sage-400/20 text-sage-500"
                        : "bg-ink-900/[0.06] text-ink-500"
                    }`}
                  >
                    {p.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => toggleActive(p)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-600 hover:text-terracotta-600"
                  >
                    {p.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    {p.isActive ? "Hide" : "Show"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
