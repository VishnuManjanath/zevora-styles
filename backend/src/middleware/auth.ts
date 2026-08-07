import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User, type IUser } from "../models/User.js";
import { Errors } from "../utils/errors.js";

export interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  userId: string;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    const token =
      header?.startsWith("Bearer ") ? header.slice(7) : cookieToken;

    if (!token) {
      throw Errors.unauthorized();
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await User.findById(payload.userId);

    if (!user) {
      throw Errors.unauthorized();
    }

    req.user = user;
    next();
  } catch {
    next(Errors.unauthorized());
  }
}

export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    const token =
      header?.startsWith("Bearer ") ? header.slice(7) : cookieToken;

    if (token) {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      const user = await User.findById(payload.userId);
      if (user) req.user = user;
    }
    next();
  } catch {
    next();
  }
}

export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user || req.user.role !== "admin") {
    next(Errors.forbidden("Admin access required"));
    return;
  }
  next();
}
