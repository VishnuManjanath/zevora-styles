export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "customer" | "admin";
}

export interface ProductImage {
  url: string;
  alt?: string;
  sort: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  skuSuffix: string;
  serialPrefix: string;
  stock: number;
  priceOverride?: number;
  price: number;
}

export interface Category {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  _id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: Category;
  basePrice: number;
  compareAtPrice?: number;
  images: ProductImage[];
  tags: string[];
  isActive: boolean;
  variants: ProductVariant[];
  createdAt: string;
}

export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  quantity: number;
  product: { sku: string; name: string; images: ProductImage[] };
  size: string;
  price: number;
  lineTotal: number;
  inStock: boolean;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface Address {
  _id: string;
  userId: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

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

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  currency: string;
  addressSnapshot: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    label?: string;
  };
  promisedDeliveryAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productName: string;
  size: string;
  sku: string;
  unitSerial: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface DeliveryEvent {
  status: string;
  description: string;
  location?: string;
  occurredAt: string;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  payment: {
    status: string;
    method: string;
    amount: number;
  } | null;
  tracking: { status: string; trackingId: string; currentLocation?: string } | null;
  deliveryEvents: DeliveryEvent[];
}

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

export interface DisputeMessage {
  id: string;
  disputeId: string;
  sender: "customer" | "system" | "agent";
  body: string;
  createdAt: string;
}

export interface DisputeEvidence {
  id: string;
  type: "upload" | "live_capture";
  fileUrl?: string;
  trustTier?: "A" | "B" | "C";
  createdAt: string;
}

export interface Dispute {
  id: string;
  _id: string;
  orderId: string;
  userId: string;
  claimType: ClaimType;
  status: DisputeStatus;
  description: string;
  outcome?: string;
  outcomeAmount?: number;
  openedAt: string;
  resolvedAt?: string;
  createdAt: string;
  messages?: DisputeMessage[];
  evidence?: DisputeEvidence[];
}
