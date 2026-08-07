import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Errors } from "../utils/errors.js";

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}) {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw Errors.badRequest("EMAIL_EXISTS", "Email already registered");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await User.create({
    email: data.email.toLowerCase(),
    passwordHash,
    name: data.name,
    phone: data.phone,
    role: "customer",
  });

  return { user, token: signToken(user._id.toString()) };
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw Errors.unauthorized("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw Errors.unauthorized("Invalid email or password");
  }

  return { user, token: signToken(user._id.toString()) };
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function sanitizeUser(user: {
  _id: unknown;
  email: string;
  name: string;
  phone?: string;
  role: string;
}) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
  };
}
