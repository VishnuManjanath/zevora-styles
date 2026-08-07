import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { Address } from "../models/Address.js";
import { previewCheckout, createOrder } from "../services/checkoutService.js";
import { Errors } from "../utils/errors.js";

const router = Router();

router.use(authMiddleware);

router.get("/addresses", async (req: AuthRequest, res, next) => {
  try {
    const addresses = await Address.find({ userId: req.user!._id }).lean();
    res.json({ addresses });
  } catch (err) {
    next(err);
  }
});

router.post("/addresses", async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      label: z.string().optional(),
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      pincode: z.string(),
      isDefault: z.boolean().optional(),
    }).parse(req.body);

    if (body.isDefault) {
      await Address.updateMany({ userId: req.user!._id }, { isDefault: false });
    }

    const address = await Address.create({
      userId: req.user!._id,
      ...body,
    });
    res.status(201).json({ address });
  } catch (err) {
    next(err);
  }
});

router.patch("/addresses/:id", async (req: AuthRequest, res, next) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    });
    if (!address) throw Errors.notFound("Address not found");

    const body = z.object({
      label: z.string().optional(),
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      isDefault: z.boolean().optional(),
    }).parse(req.body);

    Object.assign(address, body);
    await address.save();
    res.json({ address });
  } catch (err) {
    next(err);
  }
});

router.delete("/addresses/:id", async (req: AuthRequest, res, next) => {
  try {
    const result = await Address.deleteOne({
      _id: req.params.id,
      userId: req.user!._id,
    });
    if (result.deletedCount === 0) throw Errors.notFound("Address not found");
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post("/checkout/preview", async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ addressId: z.string().optional() }).parse(req.body);
    res.json(await previewCheckout(req.user!._id, body.addressId));
  } catch (err) {
    next(err);
  }
});

router.post("/checkout/create-order", async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ addressId: z.string() }).parse(req.body);
    const { order, preview } = await createOrder(req.user!._id, body.addressId);
    res.status(201).json({ order, preview });
  } catch (err) {
    next(err);
  }
});

export default router;
