import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/auth.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../services/cartService.js";
import { routeParam } from "../utils/routeParam.js";

const router = Router();

function cartContext(req: AuthRequest) {
  const sessionId = req.headers["x-session-id"] as string | undefined;
  return { userId: req.user?._id, sessionId };
}

router.get("/", optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    res.json(await getCart(cartContext(req)));
  } catch (err) {
    next(err);
  }
});

router.post("/items", optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = z
      .object({ variantId: z.string(), quantity: z.number().int().min(1) })
      .parse(req.body);
    res.json(
      await addToCart(cartContext(req), body.variantId, body.quantity),
    );
  } catch (err) {
    next(err);
  }
});

router.patch("/items/:variantId", optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ quantity: z.number().int().min(0) }).parse(req.body);
    res.json(
      await updateCartItem(
        cartContext(req),
        routeParam(req.params.variantId),
        body.quantity,
      ),
    );
  } catch (err) {
    next(err);
  }
});

router.delete("/items/:variantId", optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    res.json(
      await removeCartItem(cartContext(req), routeParam(req.params.variantId)),
    );
  } catch (err) {
    next(err);
  }
});

router.delete("/", optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    res.json(await clearCart(cartContext(req)));
  } catch (err) {
    next(err);
  }
});

export default router;
