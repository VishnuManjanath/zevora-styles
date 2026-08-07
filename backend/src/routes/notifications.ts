import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";
import { Errors } from "../utils/errors.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/read", async (req: AuthRequest, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    });
    if (!notification) throw Errors.notFound("Notification not found");
    notification.readAt = new Date();
    await notification.save();
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

export default router;
