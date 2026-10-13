import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { config } from "./config/env.js";
import router from "./routes/index.js";
import { errorHandler } from "./middleware/index.js";
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: config.origin, credentials: true }));
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    message: { message: "Too many requests. Please try again shortly." },
  }),
);
app.use("/api", (req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.get("origin") &&
    req.get("origin") !== config.origin
  )
    return res.status(403).json({ message: "Request origin is not allowed." });
  next();
});
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", router);
app.use((req, res) => res.status(404).json({ message: "Endpoint not found." }));
app.use(errorHandler);
