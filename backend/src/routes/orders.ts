import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  listUserOrders,
  getOrderDetail,
  getDeliveryTracking,
} from "../services/orderService.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    res.json({ orders: await listUserOrders(req.user!._id) });
  } catch (err) {
    next(err);
  }
});

router.get("/:orderId", async (req: AuthRequest, res, next) => {
  try {
    res.json(
      await getOrderDetail(req.params.orderId, req.user!._id),
    );
  } catch (err) {
    next(err);
  }
});

router.get("/:orderId/tracking", async (req: AuthRequest, res, next) => {
  try {
    res.json(
      await getDeliveryTracking(req.params.orderId, req.user!._id),
    );
  } catch (err) {
    next(err);
  }
});

export default router;
