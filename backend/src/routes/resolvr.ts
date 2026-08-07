import { Router } from "express";
import { z } from "zod";
import { resolvrKeyMiddleware } from "../middleware/resolvrKey.js";
import { Dispute } from "../models/Dispute.js";
import { DeliveryEvent, DeliveryTracking } from "../models/Delivery.js";
import {
  getOrderForResolvr,
  getCustomerHistory,
} from "../services/orderService.js";
import {
  getPolicyPack,
  issueRefund,
  createNotification,
} from "../services/resolvrService.js";
import { Errors } from "../utils/errors.js";

const router = Router();

router.use(resolvrKeyMiddleware);

router.get("/orders/:orderId", async (req, res, next) => {
  try {
    res.json(await getOrderForResolvr(req.params.orderId));
  } catch (err) {
    next(err);
  }
});

router.get("/orders/:orderId/delivery", async (req, res, next) => {
  try {
    const tracking = await DeliveryTracking.findOne({
      orderId: req.params.orderId,
    }).lean();
    const events = await DeliveryEvent.find({ orderId: req.params.orderId })
      .sort({ occurredAt: 1 })
      .lean();
    res.json({ tracking, events });
  } catch (err) {
    next(err);
  }
});

router.get("/customers/:userId/history", async (req, res, next) => {
  try {
    res.json(await getCustomerHistory(req.params.userId));
  } catch (err) {
    next(err);
  }
});

router.post("/refunds", async (req, res, next) => {
  try {
    const body = z.object({
      orderId: z.string(),
      amount: z.number().int().positive(),
      disputeId: z.string().optional(),
      clauseId: z.string().optional(),
      idempotencyKey: z.string(),
      hitlApprovalToken: z.string().optional(),
      reason: z.string().optional(),
    }).parse(req.body);

    const result = await issueRefund(body);
    res.status(result.replay ? 200 : 201).json({
      refund: result.refund,
      replay: result.replay,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/notify", async (req, res, next) => {
  try {
    const body = z.object({
      userId: z.string(),
      channel: z.enum(["in_app", "sms_mock", "email_mock"]),
      template: z.string(),
      title: z.string(),
      body: z.string(),
      metadata: z.record(z.unknown()).optional(),
    }).parse(req.body);

    const notification = await createNotification(body);
    res.status(201).json({ notification });
  } catch (err) {
    next(err);
  }
});

router.post("/disputes", async (req, res, next) => {
  try {
    const body = z.object({
      orderId: z.string(),
      userId: z.string(),
      claimType: z.string(),
      description: z.string(),
      resolvrCaseId: z.string().optional(),
    }).parse(req.body);

    const dispute = await Dispute.create({
      orderId: body.orderId,
      userId: body.userId,
      claimType: body.claimType,
      description: body.description,
      resolvrCaseId: body.resolvrCaseId,
      status: "under_review",
    });

    res.status(201).json({ dispute });
  } catch (err) {
    next(err);
  }
});

router.patch("/disputes/:id", async (req, res, next) => {
  try {
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!dispute) throw Errors.notFound("Dispute not found");
    res.json({ dispute });
  } catch (err) {
    next(err);
  }
});

router.get("/policy", async (_req, res, next) => {
  try {
    res.json(await getPolicyPack());
  } catch (err) {
    next(err);
  }
});

export default router;
