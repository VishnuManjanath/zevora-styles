import mongoose, { Schema, type Document } from "mongoose";

export interface IPolicyConfig extends Document {
  key: string;
  autoResolveCap: number;
  enabledClaimTypes: string[];
  returnWindowDays: number;
  policyPackVersion: number;
  updatedAt: Date;
}

const policyConfigSchema = new Schema<IPolicyConfig>(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    autoResolveCap: { type: Number, default: 80000 },
    enabledClaimTypes: {
      type: [String],
      default: ["damage", "wrong_item", "delivery_delay", "size_exchange"],
    },
    returnWindowDays: { type: Number, default: 7 },
    policyPackVersion: { type: Number, default: 1 },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const PolicyConfig = mongoose.model<IPolicyConfig>(
  "PolicyConfig",
  policyConfigSchema,
);

export interface IPolicyClause extends Document {
  clauseId: string;
  title: string;
  body: string;
  category: string;
  isActive: boolean;
  version: number;
  updatedAt: Date;
}

const clauseSchema = new Schema<IPolicyClause>(
  {
    clauseId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const PolicyClause = mongoose.model<IPolicyClause>(
  "PolicyClause",
  clauseSchema,
);

export interface IStoreConfig extends Document {
  key: string;
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  shippingFee: number;
  freeShippingMin: number;
  updatedAt: Date;
}

const storeConfigSchema = new Schema<IStoreConfig>(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    storeName: { type: String, default: "Zevora Styles" },
    supportEmail: { type: String, default: "support@zevora.com" },
    supportPhone: { type: String, default: "+91 98765 43210" },
    shippingFee: { type: Number, default: 4900 },
    freeShippingMin: { type: Number, default: 99900 },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const StoreConfig = mongoose.model<IStoreConfig>(
  "StoreConfig",
  storeConfigSchema,
);
