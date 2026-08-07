import mongoose, { Schema, type Document } from "mongoose";

export interface IDeliveryTracking extends Document {
  orderId: string;
  carrier: string;
  trackingId: string;
  status: string;
  currentLocation?: string;
  updatedAt: Date;
}

const trackingSchema = new Schema<IDeliveryTracking>(
  {
    orderId: { type: String, required: true, unique: true },
    carrier: { type: String, default: "mock_delhivery" },
    trackingId: { type: String, required: true },
    status: { type: String, required: true },
    currentLocation: String,
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const DeliveryTracking = mongoose.model<IDeliveryTracking>(
  "DeliveryTracking",
  trackingSchema,
);

export interface IDeliveryEvent extends Document {
  orderId: string;
  status: string;
  description: string;
  location?: string;
  occurredAt: Date;
  createdAt: Date;
}

const deliveryEventSchema = new Schema<IDeliveryEvent>(
  {
    orderId: { type: String, required: true },
    status: { type: String, required: true },
    description: { type: String, required: true },
    location: String,
    occurredAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const DeliveryEvent = mongoose.model<IDeliveryEvent>(
  "DeliveryEvent",
  deliveryEventSchema,
);
