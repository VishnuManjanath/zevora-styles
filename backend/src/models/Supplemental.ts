import mongoose, { Schema, type Document } from "mongoose";

export interface IReturnPickup extends Document {
  orderId: string;
  disputeId?: mongoose.Types.ObjectId;
  status: "scheduled" | "picked_up" | "failed" | "cancelled";
  scheduledAt: Date;
  addressSnapshot: Record<string, unknown>;
  mockPickupId: string;
  createdAt: Date;
}

const returnPickupSchema = new Schema<IReturnPickup>(
  {
    orderId: { type: String, required: true },
    disputeId: { type: Schema.Types.ObjectId, ref: "Dispute" },
    status: {
      type: String,
      enum: ["scheduled", "picked_up", "failed", "cancelled"],
      default: "scheduled",
    },
    scheduledAt: { type: Date, required: true },
    addressSnapshot: { type: Schema.Types.Mixed, required: true },
    mockPickupId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const ReturnPickup = mongoose.model<IReturnPickup>(
  "ReturnPickup",
  returnPickupSchema,
);

export interface IPayoutLink extends Document {
  userId: mongoose.Types.ObjectId;
  orderId: string;
  disputeId?: mongoose.Types.ObjectId;
  amount: number;
  upiId?: string;
  mockLinkUrl: string;
  status: "pending" | "claimed" | "expired";
  expiresAt: Date;
  createdAt: Date;
}

const payoutLinkSchema = new Schema<IPayoutLink>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: String, required: true },
    disputeId: { type: Schema.Types.ObjectId, ref: "Dispute" },
    amount: { type: Number, required: true },
    upiId: String,
    mockLinkUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "claimed", "expired"],
      default: "pending",
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const PayoutLink = mongoose.model<IPayoutLink>("PayoutLink", payoutLinkSchema);

export interface IInventoryMovement extends Document {
  variantId: mongoose.Types.ObjectId;
  delta: number;
  reason: string;
  referenceId?: string;
  createdAt: Date;
}

const inventorySchema = new Schema<IInventoryMovement>(
  {
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    delta: { type: Number, required: true },
    reason: { type: String, required: true },
    referenceId: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const InventoryMovement = mongoose.model<IInventoryMovement>(
  "InventoryMovement",
  inventorySchema,
);
