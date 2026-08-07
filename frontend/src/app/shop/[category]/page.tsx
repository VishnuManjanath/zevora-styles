import { notFound } from "next/navigation";
import { getCategories, getProducts } from "@/lib/data";
import { ShopGrid } from "@/components/shop-grid";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const [categories, { products }] = await Promise.all([
    getCategories(),
    getProducts({ category }),
  ]);

  const cat = categories.find((c) => c.slug === category);
  if (!cat && categories.length > 0) notFound();

  return (
    <div className="container-page py-16">
      <div className="mb-10">
        <p className="eyebrow mb-3">Collection</p>
        <h1 className="font-display text-[42px] text-ink-900">
          {cat?.name || category}
        </h1>
        {cat?.description && (
          <p className="mt-3 max-w-xl text-sm text-ink-500">{cat.description}</p>
        )}
      </div>
      <ShopGrid
        initialProducts={products}
        categories={categories}
        activeCategory={category}
      />
    </div>
  );
}
