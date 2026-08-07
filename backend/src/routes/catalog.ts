import { Router } from "express";
import {
  listCategories,
  listProducts,
  getProductBySku,
  searchProducts,
  getFeaturedProducts,
} from "../services/catalogService.js";

const router = Router();

router.get("/categories", async (_req, res, next) => {
  try {
    res.json(await listCategories());
  } catch (err) {
    next(err);
  }
});

router.get("/products", async (req, res, next) => {
  try {
    const minPrice = req.query.minPrice
      ? Number(req.query.minPrice)
      : undefined;
    const maxPrice = req.query.maxPrice
      ? Number(req.query.maxPrice)
      : undefined;
    const products = await listProducts({
      category: req.query.category as string | undefined,
      minPrice,
      maxPrice,
      sort: req.query.sort as string | undefined,
    });
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

router.get("/products/:sku", async (req, res, next) => {
  try {
    res.json(await getProductBySku(req.params.sku));
  } catch (err) {
    next(err);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const q = (req.query.q as string) || "";
    res.json({ products: await searchProducts(q) });
  } catch (err) {
    next(err);
  }
});

router.get("/featured", async (_req, res, next) => {
  try {
    res.json({ products: await getFeaturedProducts() });
  } catch (err) {
    next(err);
  }
});

export default router;
