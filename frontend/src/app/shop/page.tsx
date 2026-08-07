import { getCategories, getProducts } from "@/lib/data";
import { ShopGrid } from "@/components/shop-grid";

export default async function ShopPage() {
  const [categories, { products }] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  return (
    <div className="container-page py-16">
      <div className="mb-10">
        <p className="eyebrow mb-3">The Full Collection</p>
        <h1 className="font-display text-[42px] text-ink-900">
          Shop All Products
        </h1>
      </div>
      <ShopGrid initialProducts={products} categories={categories} />
    </div>
  );
}
