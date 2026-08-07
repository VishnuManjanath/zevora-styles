import mongoose, { Schema, type Document, type Types } from "mongoose";

export type ClaimType =
  | "damage"
  | "wrong_item"
  | "delivery_delay"
  | "size_exchange"
  | "not_as_described"
  | "other";

export type DisputeStatus =
  | "opened"
  | "evidence_pending"
  | "under_review"
  | "auto_resolved"
  | "escalated"
  | "approved"
  | "rejected"
  | "closed";

export interface IDispute extends Document {
  orderId: string;
  userId: Types.ObjectId;
  orderItemId?: Types.ObjectId;
  claimType: ClaimType;
  status: DisputeStatus;
  description: string;
  resolvrCaseId?: string;
  outcome?: string;
  outcomeAmount?: number;
  hitlApproved: boolean;
  hitlApprovalToken?: string;
  openedAt: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const disputeSchema = new Schema<IDispute>(
  {
    orderId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderItemId: { type: Schema.Types.ObjectId, ref: "OrderItem" },
    claimType: {
      type: String,
      enum: [
        "damage",
        "wrong_item",
        "delivery_delay",
        "size_exchange",
        "not_as_described",
        "other",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "opened",
        "evidence_pending",
        "under_review",
        "auto_resolved",
        "escalated",
        "approved",
        "rejected",
        "closed",
      ],
      default: "opened",
    },
    description: { type: String, required: true },
    resolvrCaseId: String,
    outcome: String,
    outcomeAmount: Number,
    hitlApproved: { type: Boolean, default: false },
    hitlApprovalToken: String,
    openedAt: { type: Date, default: Date.now },
    resolvedAt: Date,
  },
  { timestamps: true },
);

export const Dispute = mongoose.model<IDispute>("Dispute", disputeSchema);

export interface IDisputeMessage extends Document {
  disputeId: Types.ObjectId;
  sender: "customer" | "system" | "agent";
  body: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const messageSchema = new Schema<IDisputeMessage>(
  {
    disputeId: { type: Schema.Types.ObjectId, ref: "Dispute", required: true },
    sender: { type: String, enum: ["customer", "system", "agent"], required: true },
    body: { type: String, required: true },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const DisputeMessage = mongoose.model<IDisputeMessage>(
  "DisputeMessage",
  messageSchema,
);

export interface IDisputeEvidence extends Document {
  disputeId: Types.ObjectId;
  type: "upload" | "live_capture";
  fileUrl?: string;
  sessionNonce?: string;
  trustTier?: "A" | "B" | "C";
  forensics?: Record<string, unknown>;
  createdAt: Date;
}

const evidenceSchema = new Schema<IDisputeEvidence>(
  {
    disputeId: { type: Schema.Types.ObjectId, ref: "Dispute", required: true },
    type: { type: String, enum: ["upload", "live_capture"], required: true },
    fileUrl: String,
    sessionNonce: String,
    trustTier: { type: String, enum: ["A", "B", "C"] },
    forensics: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const DisputeEvidence = mongoose.model<IDisputeEvidence>(
  "DisputeEvidence",
  evidenceSchema,
);
