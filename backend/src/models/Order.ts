import mongoose, { Schema, type Document, type Types } from "mongoose";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partial_refund";

export interface IAddressSnapshot {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  label?: string;
}

export interface IOrder extends Document {
  orderId: string;
  userId: Types.ObjectId;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  currency: string;
  addressSnapshot: IAddressSnapshot;
  promisedDeliveryAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partial_refund"],
      default: "pending",
    },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    addressSnapshot: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      label: String,
    },
    promisedDeliveryAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    notes: String,
  },
  { timestamps: true },
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);

export interface IOrderItem extends Document {
  orderId: string;
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
  productName: string;
  size: string;
  sku: string;
  unitSerial: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    orderId: { type: String, required: true, ref: "Order" },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    productName: { type: String, required: true },
    size: { type: String, required: true },
    sku: { type: String, required: true },
    unitSerial: { type: String, required: true, unique: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const OrderItem = mongoose.model<IOrderItem>("OrderItem", orderItemSchema);
