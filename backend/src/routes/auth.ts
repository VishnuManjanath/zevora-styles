import { Router } from "express";
import { z } from "zod";
import {
  loginUser,
  registerUser,
  sanitizeUser,
} from "../services/authService.js";
import { mergeGuestCart } from "../services/cartService.js";
import type { AuthRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { Errors } from "../utils/errors.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  // Which portal the login attempt came from. When present, the account's
  // role must match — keeps admin accounts out of the storefront login and
  // customer accounts out of the admin portal, enforced server-side.
  portal: z.enum(["customer", "admin"]).optional(),
});

router.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const { user, token } = await registerUser(body);
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    res.status(201).json({ user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const { user, token } = await loginUser(body.email, body.password);

    if (body.portal === "admin" && user.role !== "admin") {
      throw Errors.forbidden("This account does not have admin access.");
    }
    if (body.portal === "customer" && user.role === "admin") {
      throw Errors.forbidden(
        "Admin accounts must sign in at the Admin Portal.",
      );
    }

    const sessionId = req.headers["x-session-id"] as string | undefined;
    if (sessionId) {
      await mergeGuestCart(user._id, sessionId);
    }

    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: { code: "UNAUTHORIZED" } });
  res.json({ user: sanitizeUser(req.user) });
});

export default router;
