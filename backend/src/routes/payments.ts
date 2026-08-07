import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  initiatePayment,
  confirmMockPayment,
  confirmCodOrder,
} from "../services/paymentService.js";
import { Payment } from "../models/Payment.js";
import { Errors } from "../utils/errors.js";

const router = Router();

router.use(authMiddleware);

router.post("/initiate", async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ orderId: z.string() }).parse(req.body);
    res.json(
      await initiatePayment(body.orderId, String(req.user!._id)),
    );
  } catch (err) {
    next(err);
  }
});

router.post("/mock/confirm", async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      orderId: z.string(),
      success: z.boolean(),
    }).parse(req.body);
    res.json(
      await confirmMockPayment(
        body.orderId,
        String(req.user!._id),
        body.success,
      ),
    );
  } catch (err) {
    next(err);
  }
});

router.post("/cod/confirm", async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ orderId: z.string() }).parse(req.body);
    res.json(await confirmCodOrder(body.orderId, req.user!._id));
  } catch (err) {
    next(err);
  }
});

router.get("/:orderId", async (req: AuthRequest, res, next) => {
  try {
    const payment = await Payment.findOne({
      orderId: req.params.orderId,
    }).lean();
    if (!payment) throw Errors.notFound("Payment not found");
    res.json({ payment });
  } catch (err) {
    next(err);
  }
});

export default router;
