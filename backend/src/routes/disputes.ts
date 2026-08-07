import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  openDispute,
  listUserDisputes,
  getDisputeDetail,
  addDisputeMessage,
  createCaptureSession,
} from "../services/disputeService.js";
import type { ClaimType } from "../models/Dispute.js";

const router = Router();

router.use(authMiddleware);

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      orderId: z.string(),
      claimType: z.enum([
        "damage",
        "wrong_item",
        "delivery_delay",
        "size_exchange",
        "not_as_described",
        "other",
      ]),
      description: z.string().min(1),
      orderItemId: z.string().optional(),
    }).parse(req.body);

    const dispute = await openDispute(req.user!._id, {
      orderId: body.orderId,
      claimType: body.claimType as ClaimType,
      description: body.description,
      orderItemId: body.orderItemId,
    });
    res.status(201).json({ dispute: { ...dispute.toObject(), id: String(dispute._id) } });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    res.json({ disputes: await listUserDisputes(req.user!._id) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    res.json(await getDisputeDetail(req.params.id, req.user!._id));
  } catch (err) {
    next(err);
  }
});

router.post("/:id/messages", async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ body: z.string().min(1) }).parse(req.body);
    const message = await addDisputeMessage(
      req.params.id,
      req.user!._id,
      body.body,
    );
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/capture-session", async (req: AuthRequest, res, next) => {
  try {
    res.json(await createCaptureSession(req.params.id, req.user!._id));
  } catch (err) {
    next(err);
  }
});

export default router;
