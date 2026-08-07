import { Router } from "express";
import { StoreConfig } from "../models/Policy.js";
import { Category } from "../models/Product.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const store = await StoreConfig.findOne({ key: "default" }).lean();
    const categories = await Category.find().sort({ sortOrder: 1 }).lean();

    res.json({
      store: store ?? { storeName: "Zevora Styles" },
      categories,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
