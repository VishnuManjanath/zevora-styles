import mongoose, { Schema, type Document } from "mongoose";

export interface IPayment extends Document {
  orderId: string;
  amount: number;
  method: "razorpay_mock" | "cod";
  status: "pending" | "paid" | "failed";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  failureReason?: string;
  paidAt?: Date;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["razorpay_mock", "cod"], default: "razorpay_mock" },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    failureReason: String,
    paidAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Payment = mongoose.model<IPayment>("Payment", paymentSchema);

export interface IRefundTransaction extends Document {
  orderId: string;
  disputeId?: mongoose.Types.ObjectId;
  amount: number;
  status: "pending" | "completed" | "failed";
  reason?: string;
  mockRefundId?: string;
  idempotencyKey: string;
  hitlApproved: boolean;
  hitlApprovedBy?: mongoose.Types.ObjectId;
  hitlApprovedAt?: Date;
  clauseId?: string;
  createdAt: Date;
  completedAt?: Date;
}

const refundSchema = new Schema<IRefundTransaction>(
  {
    orderId: { type: String, required: true },
    disputeId: { type: Schema.Types.ObjectId, ref: "Dispute" },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    reason: String,
    mockRefundId: String,
    idempotencyKey: { type: String, required: true, unique: true },
    hitlApproved: { type: Boolean, default: false },
    hitlApprovedBy: { type: Schema.Types.ObjectId, ref: "User" },
    hitlApprovedAt: Date,
    clauseId: String,
    completedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const RefundTransaction = mongoose.model<IRefundTransaction>(
  "RefundTransaction",
  refundSchema,
);
