import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import authRoutes from './routes/auth.route.js';
import { connectDB } from "./lib/db.js";
import { initializeSocket, getSocketInstance } from './socket/socket.js';
import sessionRoute from './routes/session.route.js';
import { apiLimiter, authLimiter, sessionLimiter } from "./middleware/rateLimiter.js";
import http from 'http';
import path from 'path';

dotenv.config();

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();
const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, configure properly in production
  crossOriginEmbedderPolicy: false,
}));

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9)
}));

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: 'Content-Type,Authorization',
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(cookieParser());

// Apply rate limiters
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/interview", sessionLimiter, sessionRoute);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(buildPath));

  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

initializeSocket(server);

server.listen(PORT, () => {
  connectDB();
  console.log(`🚀 Server is running on port ${PORT}`);
});
