import { randomBytes } from "crypto";

export function generateOrderId(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${n}`;
}

export function generateUnitSerial(prefix: string): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${n}`;
}

export function generateMockId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function generateHitlToken(): string {
  return randomBytes(24).toString("hex");
}

export function generateSessionId(): string {
  return randomBytes(16).toString("hex");
}
