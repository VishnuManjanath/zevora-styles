import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import catalogRoutes from "./routes/catalog.js";
import cartRoutes from "./routes/cart.js";
import checkoutRoutes from "./routes/checkout.js";
import paymentRoutes from "./routes/payments.js";
import orderRoutes from "./routes/orders.js";
import disputeRoutes from "./routes/disputes.js";
import notificationRoutes from "./routes/notifications.js";
import adminRoutes from "./routes/admin.js";
import resolvrRoutes from "./routes/resolvr.js";
import storeRoutes from "./routes/store.js";

const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

export function createApp() {
  const app = express();

  // Railway (and most PaaS) terminate TLS at a proxy in front of the app.
  app.set("trust proxy", 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
    }),
  );
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(cookieParser());

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      store: "Zevora Styles",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/docs", (_req, res) => {
    res.sendFile(path.join(process.cwd(), "openapi.json"));
  });

  app.use("/api/store", storeRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/catalog", catalogRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api", checkoutRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/disputes", disputeRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/resolvr", resolvrRoutes);

  app.use(errorHandler);

  return app;
}
