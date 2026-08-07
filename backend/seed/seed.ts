import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDb, disconnectDb } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Address } from "../src/models/Address.js";
import { Category, Product, ProductVariant } from "../src/models/Product.js";
import { Order, OrderItem } from "../src/models/Order.js";
import { Payment } from "../src/models/Payment.js";
import { DeliveryEvent, DeliveryTracking } from "../src/models/Delivery.js";
import { PolicyConfig, PolicyClause, StoreConfig } from "../src/models/Policy.js";

dotenv.config();

const UNSPLASH = "https://images.unsplash.com";

const products = [
  {
    sku: "ZS-001",
    name: "Jaipur Block Print Kurti",
    description: "Hand-block printed cotton kurti in mustard. Soft breathable fabric.",
    category: "kurtis",
    basePrice: 129900,
    compareAtPrice: 159900,
    image:
      `${UNSPLASH}/photo-1594938298603-c8148c4dae35?w=800&q=80`,
    serialPrefix: "ZS-001",
    stock: 25,
  },
  {
    sku: "ZS-002",
    name: "Chanderi Dupatta",
    description: "Elegant wine chanderi dupatta with subtle zari border.",
    category: "dupattas",
    basePrice: 64900,
    image:
      `${UNSPLASH}/photo-1610032546270-b52493247e0b?w=800&q=80`,
    serialPrefix: "ZS-002",
    stock: 40,
  },
  {
    sku: "ZS-003",
    name: "Cotton Kurta Set",
    description: "Sage green kurta with matching pants. Everyday comfort.",
    category: "sets",
    basePrice: 189900,
    image:
      `${UNSPLASH}/photo-1583391733981-c89e3e8162c8?w=800&q=80`,
    serialPrefix: "ZS-003",
    stock: 18,
  },
  {
    sku: "ZS-004",
    name: "Linen Straight Kurti",
    description: "Ivory linen straight kurti. Minimal and elegant.",
    category: "kurtis",
    basePrice: 89900,
    image:
      `${UNSPLASH}/photo-1572804013309-59a88b7e92f1?w=800&q=80`,
    serialPrefix: "ZS-004",
    stock: 30,
  },
  {
    sku: "ZS-005",
    name: "Festive Anarkali",
    description: "Maroon festive anarkali with delicate embroidery.",
    category: "kurtis",
    basePrice: 249900,
    image:
      `${UNSPLASH}/photo-1617127365659-c47fa864d8bc?w=800&q=80`,
    serialPrefix: "ZS-005",
    stock: 12,
  },
  {
    sku: "ZS-006",
    name: "Everyday Cotton Kurti",
    description: "White everyday cotton kurti. Wardrobe essential.",
    category: "kurtis",
    basePrice: 59900,
    image:
      `${UNSPLASH}/photo-1591047139829-d91aecb6caea?w=800&q=80`,
    serialPrefix: "ZS-006",
    stock: 50,
  },
];

const clauses = [
  {
    clauseId: "3.1",
    title: "Size Exchange",
    body: "Wrong size reported within 7 days of delivery → one free exchange.",
    category: "exchange",
  },
  {
    clauseId: "4.2",
    title: "Damaged on Arrival",
    body:
      "Visible tear, stain, or defect at delivery → full refund or replacement within 48 hours. Evidence: damage + price tag in same frame.",
    category: "damage",
  },
  {
    clauseId: "5.1",
    title: "Delivery Delay",
    body: "Not delivered within 10 days of promised date → full refund on request.",
    category: "delivery",
  },
  {
    clauseId: "6.0",
    title: "Auto-Resolution Limit",
    body: "Disputes under seller auto-resolve cap may be auto-approved.",
    category: "policy",
  },
  {
    clauseId: "7.3",
    title: "Fraud",
    body: "AI-generated or manipulated evidence → dispute rejected; account flagged.",
    category: "fraud",
  },
];

async function seed() {
  await connectDb();

  await mongoose.connection.dropDatabase();
  console.log("Database cleared");

  await StoreConfig.create({
    key: "default",
    storeName: "Zevora Styles",
    supportEmail: "support@zevora.com",
    supportPhone: "+91 98765 43210",
    shippingFee: 4900,
    freeShippingMin: 99900,
  });

  await PolicyConfig.create({
    key: "default",
    autoResolveCap: 80000,
    enabledClaimTypes: [
      "damage",
      "wrong_item",
      "delivery_delay",
      "size_exchange",
    ],
    returnWindowDays: 7,
    policyPackVersion: 1,
  });

  for (const c of clauses) {
    await PolicyClause.create({ ...c, isActive: true, version: 1 });
  }

  const categories = await Category.insertMany([
    { slug: "kurtis", name: "Kurtis", sortOrder: 1 },
    { slug: "dupattas", name: "Dupattas", sortOrder: 2 },
    { slug: "sets", name: "Kurta Sets", sortOrder: 3 },
  ]);

  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c._id]));

  const passwordHash = await bcrypt.hash("demo1234", 10);
  const adminHash = await bcrypt.hash("admin1234", 10);

  const arjun = await User.create({
    email: "arjun@demo.com",
    passwordHash,
    name: "Arjun",
    phone: "+91 9876543210",
    role: "customer",
  });

  const faker = await User.create({
    email: "fake@demo.com",
    passwordHash,
    name: "Fake User",
    phone: "+91 9000000001",
    role: "customer",
  });

  await User.create({
    email: "admin@zevora.com",
    passwordHash: adminHash,
    name: "Zevora Admin",
    phone: "+91 9876543211",
    role: "admin",
  });

  await Address.create({
    userId: arjun._id,
    label: "Home",
    line1: "12 Temple Road",
    city: "Thrissur",
    state: "Kerala",
    pincode: "680001",
    isDefault: true,
  });

  const variantMap: Record<string, mongoose.Types.ObjectId> = {};

  for (const p of products) {
    const product = await Product.create({
      sku: p.sku,
      name: p.name,
      description: p.description,
      categoryId: catMap[p.category],
      basePrice: p.basePrice,
      compareAtPrice: p.compareAtPrice,
      images: [{ url: p.image, alt: p.name, sort: 0 }],
      tags: ["ethnic", "handloom"],
      isActive: true,
    });

    const variant = await ProductVariant.create({
      productId: product._id,
      size: "M",
      skuSuffix: "-M",
      serialPrefix: p.serialPrefix,
      stock: p.stock,
    });

    variantMap[p.sku] = variant._id;
  }

  const deliveredAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  await Order.create({
    orderId: "ORD-7842",
    userId: arjun._id,
    status: "delivered",
    paymentStatus: "paid",
    subtotal: 129900,
    shippingFee: 0,
    discount: 0,
    total: 129900,
    addressSnapshot: {
      line1: "12 Temple Road",
      city: "Thrissur",
      state: "Kerala",
      pincode: "680001",
    },
    promisedDeliveryAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    deliveredAt,
  });

  await OrderItem.create({
    orderId: "ORD-7842",
    productId: (await Product.findOne({ sku: "ZS-001" }))!._id,
    variantId: variantMap["ZS-001"],
    productName: "Jaipur Block Print Kurti",
    size: "M",
    sku: "ZS-001-M",
    unitSerial: "ZS-001-2847",
    quantity: 1,
    unitPrice: 129900,
    lineTotal: 129900,
  });

  await Payment.create({
    orderId: "ORD-7842",
    amount: 129900,
    method: "razorpay_mock",
    status: "paid",
    razorpayOrderId: "order_MOCK_7842",
    razorpayPaymentId: "pay_MOCK_7842",
    paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  });

  await DeliveryTracking.create({
    orderId: "ORD-7842",
    carrier: "mock_delhivery",
    trackingId: "DLV-MOCK-7842",
    status: "delivered",
    currentLocation: "Thrissur",
  });

  await DeliveryEvent.insertMany([
    {
      orderId: "ORD-7842",
      status: "label_created",
      description: "Shipping label created",
      occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      orderId: "ORD-7842",
      status: "shipped",
      description: "Package shipped from warehouse",
      location: "Bangalore Hub",
      occurredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      orderId: "ORD-7842",
      status: "delivered",
      description: "Delivered to customer",
      location: "Thrissur",
      occurredAt: deliveredAt,
    },
  ]);

  await Order.create({
    orderId: "ORD-7844",
    userId: arjun._id,
    status: "delivered",
    paymentStatus: "paid",
    subtotal: 59900,
    shippingFee: 4900,
    total: 64800,
    addressSnapshot: {
      line1: "12 Temple Road",
      city: "Thrissur",
      state: "Kerala",
      pincode: "680001",
    },
    deliveredAt: deliveredAt,
  });

  await OrderItem.create({
    orderId: "ORD-7844",
    productId: (await Product.findOne({ sku: "ZS-006" }))!._id,
    variantId: variantMap["ZS-006"],
    productName: "Everyday Cotton Kurti",
    size: "M",
    sku: "ZS-006-M",
    unitSerial: "ZS-006-0091",
    quantity: 1,
    unitPrice: 59900,
    lineTotal: 59900,
  });

  await Payment.create({
    orderId: "ORD-7844",
    amount: 64800,
    method: "razorpay_mock",
    status: "paid",
    paidAt: deliveredAt,
  });

  console.log("Seed complete!");
  console.log("Demo: arjun@demo.com / demo1234");
  console.log("Admin: admin@zevora.com / admin1234");
  console.log("Order ORD-7842 serial ZS-001-2847 Rs 1299");

  await disconnectDb();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
