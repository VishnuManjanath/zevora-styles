import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { Order } from "../models/Order.js";
import { Dispute } from "../models/Dispute.js";
import { RefundTransaction } from "../models/Payment.js";
import { Product, ProductVariant } from "../models/Product.js";
import { PolicyConfig, PolicyClause, StoreConfig } from "../models/Policy.js";
import { DeliveryEvent } from "../models/Delivery.js";
import {
  hitlApprove,
  hitlReject,
} from "../services/disputeService.js";
import { getOrderDetail } from "../services/orderService.js";
import { adminIssueRefund } from "../services/resolvrService.js";
import { Errors } from "../utils/errors.js";
import { routeParam } from "../utils/routeParam.js";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/dashboard", async (_req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = await Order.countDocuments({ createdAt: { $gte: today } });
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const openDisputes = await Dispute.countDocuments({
      status: { $nin: ["closed", "rejected", "auto_resolved"] },
    });
    const pendingRefunds = await RefundTransaction.countDocuments({
      status: "pending",
    });

    res.json({
      ordersToday,
      revenueToday: revenueResult[0]?.total ?? 0,
      openDisputes,
      pendingRefunds,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/products", async (_req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

router.post("/products", async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
});

router.patch("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) throw Errors.notFound("Product not found");
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!product) throw Errors.notFound("Product not found");
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

router.post("/products/:id/variants", async (req, res, next) => {
  try {
    const variant = await ProductVariant.create({
      ...req.body,
      productId: req.params.id,
    });
    res.status(201).json({ variant });
  } catch (err) {
    next(err);
  }
});

router.patch("/variants/:id", async (req, res, next) => {
  try {
    const variant = await ProductVariant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!variant) throw Errors.notFound("Variant not found");
    res.json({ variant });
  } catch (err) {
    next(err);
  }
});

router.get("/orders", async (_req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

router.get("/orders/:orderId", async (req, res, next) => {
  try {
    res.json(await getOrderDetail(req.params.orderId));
  } catch (err) {
    next(err);
  }
});

router.patch("/orders/:orderId/status", async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) throw Errors.notFound("Order not found");
    order.status = req.body.status;
    if (req.body.status === "delivered") {
      order.deliveredAt = new Date();
    }
    await order.save();
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

router.post("/orders/:orderId/delivery-event", async (req, res, next) => {
  try {
    const event = await DeliveryEvent.create({
      orderId: req.params.orderId,
      status: req.body.status,
      description: req.body.description,
      location: req.body.location,
      occurredAt: new Date(req.body.occurredAt || Date.now()),
    });
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
});

router.get("/disputes", async (_req, res, next) => {
  try {
    const disputes = await Dispute.find().sort({ createdAt: -1 }).lean();
    res.json({ disputes });
  } catch (err) {
    next(err);
  }
});

router.get("/disputes/:id", async (req, res, next) => {
  try {
    const { getDisputeDetail } = await import("../services/disputeService.js");
    res.json(await getDisputeDetail(routeParam(req.params.id)));
  } catch (err) {
    next(err);
  }
});

router.post("/disputes/:id/hitl-approve", async (req: AuthRequest, res, next) => {
  try {
    const result = await hitlApprove(routeParam(req.params.id), req.user!._id);
    res.json({
      dispute: result.dispute,
      hitlApprovalToken: result.hitlApprovalToken,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/disputes/:id/hitl-reject", async (req, res, next) => {
  try {
    res.json({ dispute: await hitlReject(routeParam(req.params.id)) });
  } catch (err) {
    next(err);
  }
});

router.get("/policy", async (_req, res, next) => {
  try {
    const config = await PolicyConfig.findOne({ key: "default" });
    const clauses = await PolicyClause.find().lean();
    res.json({ config, clauses });
  } catch (err) {
    next(err);
  }
});

router.patch("/policy/config", async (req, res, next) => {
  try {
    const config = await PolicyConfig.findOneAndUpdate(
      { key: "default" },
      req.body,
      { new: true, upsert: true },
    );
    res.json({ config });
  } catch (err) {
    next(err);
  }
});

router.patch("/policy/clauses/:clauseId", async (req, res, next) => {
  try {
    const clause = await PolicyClause.findOneAndUpdate(
      { clauseId: req.params.clauseId },
      req.body,
      { new: true, upsert: true },
    );
    res.json({ clause });
  } catch (err) {
    next(err);
  }
});

router.get("/store", async (_req, res, next) => {
  try {
    const store = await StoreConfig.findOne({ key: "default" });
    res.json({ store });
  } catch (err) {
    next(err);
  }
});

router.patch("/store", async (req, res, next) => {
  try {
    const store = await StoreConfig.findOneAndUpdate(
      { key: "default" },
      req.body,
      { new: true, upsert: true },
    );
    res.json({ store });
  } catch (err) {
    next(err);
  }
});

router.get("/refunds", async (_req, res, next) => {
  try {
    const refunds = await RefundTransaction.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ refunds });
  } catch (err) {
    next(err);
  }
});

router.post("/refunds", async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      orderId: z.string(),
      amount: z.number().int().positive(),
      clauseId: z.string().optional(),
      idempotencyKey: z.string(),
      reason: z.string().optional(),
    }).parse(req.body);

    const result = await adminIssueRefund({
      ...body,
      adminId: String(req.user!._id),
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
