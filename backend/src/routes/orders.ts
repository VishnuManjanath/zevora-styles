import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  listUserOrders,
  getOrderDetail,
  getDeliveryTracking,
} from "../services/orderService.js";
import { cancelOrder } from "../services/supplementalService.js";
import { routeParam } from "../utils/routeParam.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    res.json({ orders: await listUserOrders(req.user!._id) });
  } catch (err) {
    next(err);
  }
});

router.post("/:orderId/cancel", async (req: AuthRequest, res, next) => {
  try {
    const order = await cancelOrder(routeParam(req.params.orderId), req.user!._id);
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

router.get("/:orderId", async (req: AuthRequest, res, next) => {
  try {
    res.json(
      await getOrderDetail(routeParam(req.params.orderId), req.user!._id),
    );
  } catch (err) {
    next(err);
  }
});

router.get("/:orderId/tracking", async (req: AuthRequest, res, next) => {
  try {
    res.json(
      await getDeliveryTracking(routeParam(req.params.orderId), req.user!._id),
    );
  } catch (err) {
    next(err);
  }
});

export default router;
