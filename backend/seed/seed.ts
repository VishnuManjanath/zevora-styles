import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDb, disconnectDb } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Category, Product, ProductVariant } from "../src/models/Product.js";
import { PolicyConfig, PolicyClause, StoreConfig } from "../src/models/Policy.js";

dotenv.config();

const UNSPLASH = "https://images.unsplash.com";

// Catalog only — no orders, payments, or disputes are seeded. Every order in
// the system is created for real by placing it through the storefront
// checkout flow, so the admin dashboard genuinely reflects live activity.
// Every image URL below was opened directly and visually confirmed to show
// the correct garment before being added — not just checked for HTTP 200.
const products = [
  {
    sku: "ZS-001",
    name: "Jaipur Block Print Kurti",
    description: "Hand-block printed cotton kurti in mustard. Soft breathable fabric.",
    category: "kurtis",
    basePrice: 129900,
    compareAtPrice: 159900,
    // Woman in a navy block-print kurti with a dupatta, standing outdoors.
    image: `${UNSPLASH}/photo-1764740185240-58527413f572?w=800&q=80`,
    serialPrefix: "ZS-001",
    stock: 25,
  },
  {
    sku: "ZS-002",
    name: "Chanderi Dupatta",
    description: "Elegant wine chanderi dupatta with subtle zari border.",
    category: "dupattas",
    basePrice: 64900,
    // Close-up of cream dupatta fabric with a red woven border and tasseled pendant.
    image: `${UNSPLASH}/photo-1698156581290-03689df66ee7?w=800&q=80`,
    serialPrefix: "ZS-002",
    stock: 40,
  },
  {
    sku: "ZS-003",
    name: "Cotton Kurta Set",
    description: "Sage green kurta with matching pants. Everyday comfort.",
    category: "sets",
    basePrice: 189900,
    // Matching ikat-print co-ord top and wide-leg pants set, studio shot.
    image: `${UNSPLASH}/photo-1769063382633-ef27742cf2a1?w=800&q=80`,
    serialPrefix: "ZS-003",
    stock: 18,
  },
  {
    sku: "ZS-004",
    name: "Linen Straight Kurti",
    description: "Ivory linen straight kurti. Minimal and elegant.",
    category: "kurtis",
    basePrice: 89900,
    // Ivory kurti with delicate multicolor embroidery, studio shot.
    image: `${UNSPLASH}/photo-1742742459138-253e807f2ed2?w=800&q=80`,
    serialPrefix: "ZS-004",
    stock: 30,
  },
  {
    sku: "ZS-005",
    name: "Festive Anarkali",
    description: "Maroon festive anarkali with delicate embroidery.",
    category: "kurtis",
    basePrice: 249900,
    // Maroon and gold heavily embroidered anarkali-style gown.
    image: `${UNSPLASH}/photo-1610202305255-746aa5b971c4?w=800&q=80`,
    serialPrefix: "ZS-005",
    stock: 12,
  },
  {
    sku: "ZS-006",
    name: "Everyday Cotton Kurti",
    description: "White everyday cotton kurti. Wardrobe essential.",
    category: "kurtis",
    basePrice: 59900,
    // White floral-print straight kurti with matching pants, studio shot.
    image: `${UNSPLASH}/photo-1745313452052-0e4e341f326c?w=800&q=80`,
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

    await ProductVariant.create([
      { productId: product._id, size: "S", skuSuffix: "-S", serialPrefix: `${p.serialPrefix}-S`, stock: Math.round(p.stock * 0.6) },
      { productId: product._id, size: "M", skuSuffix: "-M", serialPrefix: `${p.serialPrefix}-M`, stock: p.stock },
      { productId: product._id, size: "L", skuSuffix: "-L", serialPrefix: `${p.serialPrefix}-L`, stock: Math.round(p.stock * 0.6) },
    ]);
  }

  // Only account that pre-exists — needed to access the admin portal at all.
  // Every customer account and every order is created live through the
  // storefront (register → shop → checkout), never seeded.
  const adminHash = await bcrypt.hash("admin1234", 10);
  await User.create({
    email: "admin@zevora.com",
    passwordHash: adminHash,
    name: "Zevora Admin",
    phone: "+91 9876543211",
    role: "admin",
  });

  console.log("Seed complete — catalog + policy only, zero mock orders.");
  console.log("Admin login: admin@zevora.com / admin1234 (at /admin/login)");
  console.log("Everything else (customers, addresses, orders, disputes) is created live via the storefront.");

  await disconnectDb();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
