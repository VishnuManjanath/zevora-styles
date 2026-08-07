"use server";

import type { Category, Product } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getCategories(): Promise<Category[]> {
  return safeFetch<Category[]>("/api/catalog/categories", []);
}

export async function getFeaturedProducts(): Promise<{ products: Product[] }> {
  return safeFetch<{ products: Product[] }>("/api/catalog/featured", {
    products: [],
  });
}

export async function getProducts(params: {
  category?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
} = {}): Promise<{ products: Product[] }> {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.sort) qs.set("sort", params.sort);
  if (params.minPrice) qs.set("minPrice", String(params.minPrice));
  if (params.maxPrice) qs.set("maxPrice", String(params.maxPrice));
  const query = qs.toString();
  return safeFetch<{ products: Product[] }>(
    `/api/catalog/products${query ? `?${query}` : ""}`,
    { products: [] },
  );
}

export async function getProductBySku(sku: string): Promise<Product | null> {
  return safeFetch<Product | null>(`/api/catalog/products/${sku}`, null);
}

export async function searchProducts(q: string): Promise<{ products: Product[] }> {
  return safeFetch<{ products: Product[] }>(
    `/api/catalog/search?q=${encodeURIComponent(q)}`,
    { products: [] },
  );
}
