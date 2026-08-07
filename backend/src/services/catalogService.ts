import { Category, Product, ProductVariant } from "../models/Product.js";
import { Errors } from "../utils/errors.js";

export async function listCategories() {
  return Category.find().sort({ sortOrder: 1 }).lean();
}

export async function listProducts(filters: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}) {
  const query: Record<string, unknown> = { isActive: true };

  if (filters.category) {
    const cat = await Category.findOne({ slug: filters.category });
    if (cat) query.categoryId = cat._id;
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.basePrice = {};
    if (filters.minPrice !== undefined) {
      (query.basePrice as Record<string, number>).$gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      (query.basePrice as Record<string, number>).$lte = filters.maxPrice;
    }
  }

  let sortOpt: Record<string, 1 | -1> = { createdAt: -1 };
  if (filters.sort === "price_asc") sortOpt = { basePrice: 1 };
  if (filters.sort === "price_desc") sortOpt = { basePrice: -1 };
  if (filters.sort === "name") sortOpt = { name: 1 };

  const products = await Product.find(query).sort(sortOpt).lean();
  const categoryIds = products.map((p) => p.categoryId);
  const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
  const catMap = new Map(categories.map((c) => [String(c._id), c]));

  const result = await Promise.all(
    products.map(async (p) => {
      const variants = await ProductVariant.find({ productId: p._id }).lean();
      return {
        ...p,
        id: String(p._id),
        category: catMap.get(String(p.categoryId)),
        variants: variants.map((v) => ({
          ...v,
          id: String(v._id),
          price: v.priceOverride ?? p.basePrice,
        })),
      };
    }),
  );

  return result;
}

export async function getProductBySku(sku: string) {
  const product = await Product.findOne({ sku, isActive: true }).lean();
  if (!product) throw Errors.notFound("Product not found");

  const category = await Category.findById(product.categoryId).lean();
  const variants = await ProductVariant.find({ productId: product._id }).lean();

  return {
    ...product,
    id: String(product._id),
    category,
    variants: variants.map((v) => ({
      ...v,
      id: String(v._id),
      price: v.priceOverride ?? product.basePrice,
    })),
  };
}

export async function searchProducts(q: string) {
  const regex = new RegExp(q, "i");
  const products = await Product.find({
    isActive: true,
    $or: [{ name: regex }, { description: regex }, { sku: regex }, { tags: regex }],
  }).limit(20).lean();

  return products.map((p) => ({ ...p, id: String(p._id) }));
}

export async function getFeaturedProducts() {
  const products = await Product.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();
  return products.map((p) => ({ ...p, id: String(p._id) }));
}
