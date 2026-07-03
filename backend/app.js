import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { errorMiddleware } from "./src/middleware/error.middleware.js";
import authRoutes from "./src/routes/auth.routes.js";
import workspaceRoutes from "./src/routes/workspace.routes.js";
import boardRoutes from "./src/routes/board.routes.js";
import columnRoutes from "./src/routes/column.routes.js";
import cardRoutes from "./src/routes/card.routes.js";
import activityRoutes from "./src/routes/activity.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import reportRoutes from "./src/routes/report.routes.js";
import analyticsRoutes from "./src/routes/analytics.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import { serveGridFSFile } from "./src/utils/gridfsStorage.js";

// Lazy MongoDB connection for Vercel serverless (cached across warm invocations)
let dbConnected = false;
const connectDB = async () => {
  if (dbConnected || mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    dbConnected = true;
  } catch (err) {
    console.error("MongoDB connection FAILED:", err);
    throw err;
  }
};

const app = express();

// Ensure DB is connected before handling any request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Normalize URL paths to prevent double slashes (e.g. //uploads/...) from returning 404
app.use((req, res, next) => {
  if (req.url.startsWith('//')) {
    req.url = req.url.replace(/^\/+/, '/');
  }
  next();
});

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(morgan("dev"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.get(['/uploads/:category/:filename', '//uploads/:category/:filename'], serveGridFSFile);
app.get(['/uploads/:filename', '//uploads/:filename'], serveGridFSFile);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1/boards", boardRoutes);
app.use("/api/v1/columns", columnRoutes);
app.use("/api/v1/cards", cardRoutes);
app.use("/api/v1/activities", activityRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(errorMiddleware);

export default app;
