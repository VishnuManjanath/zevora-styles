import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { Errors } from "../utils/errors.js";

export function resolvrKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const key = req.headers["x-resolvr-key"];
  if (!key || key !== env.RESOLVR_API_KEY) {
    next(Errors.forbidden("Invalid Resolvr API key"));
    return;
  }
  next();
}
