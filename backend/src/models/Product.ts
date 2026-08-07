import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ICategory extends Document {
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
}

const categorySchema = new Schema<ICategory>({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  imageUrl: String,
  sortOrder: { type: Number, default: 0 },
});

export const Category = mongoose.model<ICategory>("Category", categorySchema);

export interface IProductImage {
  url: string;
  alt?: string;
  sort: number;
}

export interface IProduct extends Document {
  sku: string;
  name: string;
  description?: string;
  categoryId: Types.ObjectId;
  basePrice: number;
  compareAtPrice?: number;
  images: IProductImage[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    basePrice: { type: Number, required: true },
    compareAtPrice: Number,
    images: [
      {
        url: String,
        alt: String,
        sort: { type: Number, default: 0 },
      },
    ],
    tags: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Product = mongoose.model<IProduct>("Product", productSchema);

export interface IProductVariant extends Document {
  productId: Types.ObjectId;
  size: string;
  skuSuffix: string;
  serialPrefix: string;
  stock: number;
  priceOverride?: number;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IProductVariant>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    size: { type: String, required: true },
    skuSuffix: { type: String, default: "" },
    serialPrefix: { type: String, required: true },
    stock: { type: Number, default: 0 },
    priceOverride: Number,
  },
  { timestamps: true },
);

variantSchema.index({ productId: 1, size: 1 }, { unique: true });

export const ProductVariant = mongoose.model<IProductVariant>(
  "ProductVariant",
  variantSchema,
);
