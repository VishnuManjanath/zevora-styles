import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ICartItem {
  variantId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  addedAt: Date;
}

export interface ICart extends Document {
  userId?: Types.ObjectId;
  sessionId?: string;
  items: ICartItem[];
  updatedAt: Date;
}

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", sparse: true, unique: true },
    sessionId: { type: String, sparse: true, unique: true },
    items: [
      {
        variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true },
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1 },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const Cart = mongoose.model<ICart>("Cart", cartSchema);
