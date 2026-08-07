import { searchProducts } from "@/lib/data";
import { ProductCard } from "@/components/ui/product-card";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const { products } = q ? await searchProducts(q) : { products: [] };

  return (
    <div className="container-page py-16">
      <p className="eyebrow mb-3">Search Results</p>
      <h1 className="font-display text-[38px] text-ink-900">
        {q ? `"${q}"` : "Search"}
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        {products.length} result{products.length !== 1 ? "s" : ""} found
      </p>

      {products.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-ink-900/15 py-24 text-center text-ink-500">
          No products matched your search.
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
