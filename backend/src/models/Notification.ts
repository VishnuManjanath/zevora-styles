import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  channel: "in_app" | "sms_mock" | "email_mock";
  template: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  readAt?: Date;
  sentAt: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    channel: {
      type: String,
      enum: ["in_app", "sms_mock", "email_mock"],
      required: true,
    },
    template: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    metadata: Schema.Types.Mixed,
    readAt: Date,
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);

export interface IAuditLog extends Document {
  actorType: "user" | "system" | "resolvr";
  actorId?: string;
  entityType: string;
  entityId: string;
  action: string;
  payload?: Record<string, unknown>;
  createdAt: Date;
}

const auditSchema = new Schema<IAuditLog>(
  {
    actorType: { type: String, enum: ["user", "system", "resolvr"], required: true },
    actorId: String,
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    action: { type: String, required: true },
    payload: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditSchema);
