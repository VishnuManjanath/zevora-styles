"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Category } from "@/lib/types";

interface VariantForm {
  size: string;
  skuSuffix: string;
  serialPrefix: string;
  stock: number;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    description: "",
    categoryId: "",
    basePrice: 0,
    compareAtPrice: 0,
    imageUrl: "",
    tags: "",
  });
  const [variants, setVariants] = useState<VariantForm[]>([
    { size: "S", skuSuffix: "-S", serialPrefix: "", stock: 20 },
    { size: "M", skuSuffix: "-M", serialPrefix: "", stock: 20 },
    { size: "L", skuSuffix: "-L", serialPrefix: "", stock: 20 },
  ]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Category[]>("/api/catalog/categories", { auth: false }).then((cats) => {
      setCategories(cats);
      if (cats[0]) setForm((f) => ({ ...f, categoryId: cats[0]._id }));
    });
  }, []);

  function updateVariant(i: number, patch: Partial<VariantForm>) {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const created = await api<{ product: { _id: string } }>("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          sku: form.sku,
          name: form.name,
          description: form.description,
          categoryId: form.categoryId,
          basePrice: Math.round(Number(form.basePrice) * 100),
          compareAtPrice: form.compareAtPrice
            ? Math.round(Number(form.compareAtPrice) * 100)
            : undefined,
          images: form.imageUrl ? [{ url: form.imageUrl, sort: 0 }] : [],
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      for (const v of variants) {
        if (!v.size) continue;
        await api(`/api/admin/products/${created.product._id}/variants`, {
          method: "POST",
          body: JSON.stringify({
            size: v.size,
            skuSuffix: v.skuSuffix,
            serialPrefix: v.serialPrefix || `${form.sku}-${v.size}`,
            stock: Number(v.stock),
          }),
        });
      }

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-ink-900">Add Product</h1>

      <form onSubmit={handleSubmit} className="card-surface mt-8 space-y-5 p-7">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">SKU</label>
            <input
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
              placeholder="ZS-010"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="input-field"
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label-field">Product Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="label-field">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Price (₹)</label>
            <input
              required
              type="number"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Compare At Price (₹, optional)</label>
            <input
              type="number"
              value={form.compareAtPrice}
              onChange={(e) => setForm({ ...form, compareAtPrice: Number(e.target.value) })}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="label-field">Image URL</label>
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className="input-field"
          />
        </div>

        <div>
          <label className="label-field">Tags (comma separated)</label>
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="cotton, festive, kurti"
            className="input-field"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label-field mb-0">Variants (Sizes)</label>
            <button
              type="button"
              onClick={() =>
                setVariants((v) => [...v, { size: "", skuSuffix: "", serialPrefix: "", stock: 10 }])
              }
              className="flex items-center gap-1 text-xs font-medium text-terracotta-600"
            >
              <Plus size={13} /> Add Size
            </button>
          </div>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  placeholder="Size"
                  value={v.size}
                  onChange={(e) => updateVariant(i, { size: e.target.value })}
                  className="input-field w-20"
                />
                <input
                  placeholder="Stock"
                  type="number"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                  className="input-field w-24"
                />
                <button
                  type="button"
                  onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-ink-400 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Creating…" : "Create Product"}
        </button>
      </form>
    </div>
  );
}
