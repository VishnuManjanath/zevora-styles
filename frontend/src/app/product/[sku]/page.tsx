import { notFound } from "next/navigation";
import { getProductBySku } from "@/lib/data";
import { ProductDetail } from "@/components/product-detail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const product = await getProductBySku(sku);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
