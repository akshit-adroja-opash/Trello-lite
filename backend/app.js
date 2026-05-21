import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { errorMiddleware } from "./src/middleware/error.middleware.js";
import authRoutes from "./src/routes/auth.routes.js";
import workspaceRoutes from "./src/routes/workspace.routes.js";
import boardRoutes from "./src/routes/board.routes.js";
import columnRoutes from "./src/routes/column.routes.js";
import cardRoutes from "./src/routes/card.routes.js";
import activityRoutes from "./src/routes/activity.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1/boards", boardRoutes);
app.use("/api/v1/columns", columnRoutes);
app.use("/api/v1/cards", cardRoutes);
app.use("/api/v1/activities", activityRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(errorMiddleware);

export default app;
