import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authRoutes } from "./routes/authRoutes.js";
import { barcodeRoutes, categoryRoutes, customerRoutes, productRoutes, supplierProductRoutes, supplierRoutes } from "./routes/catalogRoutes.js";
import { adjustmentRoutes, inventoryRoutes, movementRoutes, notificationRoutes, posRoutes, refundRoutes, salesRoutes, stockInRoutes, stockOutRoutes } from "./routes/inventoryRoutes.js";
import { auditRoutes, dashboardRoutes, permissionRoutes, reportRoutes, roleRoutes, settingRoutes, supplierPerformanceRoutes, userRoutes } from "./routes/adminRoutes.js";

export const app = express();
const allowedOrigins = new Set([env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"]);

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500 }));
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIRECTORY)));

app.get("/health", (_req, res) => res.json({ success: true, message: "SmartStock API is healthy", data: {}, meta: {} }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/barcodes", barcodeRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/supplier-products", supplierProductRoutes);
app.use("/api/supplier-deliveries", stockInRoutes);
app.use("/api/supplier-performance", supplierPerformanceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/stock-in", stockInRoutes);
app.use("/api/stock-out", stockOutRoutes);
app.use("/api/stock-movements", movementRoutes);
app.use("/api/inventory-adjustments", adjustmentRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/payments", salesRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/settings", settingRoutes);

app.use(notFound);
app.use(errorHandler);
