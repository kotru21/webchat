import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import compression from "compression";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import helmet from "helmet";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", process.env.CLIENT_URL],
        mediaSrc: ["'self'", "data:", "blob:", process.env.CLIENT_URL],
        connectSrc: ["'self'", process.env.CLIENT_URL],
      },
    },
  })
);
app.use(xss());
app.use(mongoSanitize());
app.use(compression());

// Static file serving with CORS headers
app.use(
  "/uploads",
  (req, res, next) => {
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Create required directories
const ensureUploadsDir = async () => {
  const dirs = [
    path.join(__dirname, "uploads"),
    path.join(__dirname, "uploads", "avatars"),
    path.join(__dirname, "uploads", "media"),
  ];

  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

// Online users storage
const onlineUsers = new Map();

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("user_connected", (userData) => {
    onlineUsers.set(socket.id, userData);
    socket.join(userData.id.toString());
    io.emit("users_online", Array.from(onlineUsers.values()));
  });

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);
    io.emit("users_online", Array.from(onlineUsers.values()));
    console.log("User disconnected:", socket.id);
  });
});

// Initialize server
const startServer = async () => {
  try {
    await ensureUploadsDir();
    console.log("Uploads directories created");

    await connectDB();

    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server initialization failed:", err);
    process.exit(1);
  }
};

startServer();
