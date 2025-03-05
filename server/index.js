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

// Добавляем дополнительные CORS заголовки
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_URL);
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// app.use("/api", globalLimiter);

app.use(
  "/uploads",
  (req, res, next) => {
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// Маршруты без глобального лимитера
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Что-то пошло не так!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Создание директорий
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

ensureUploadsDir()
  .then(() => console.log("Uploads directories created"))
  .catch(console.error);

// Настройка Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

// Хранилище для онлайн пользователей
const onlineUsers = new Map();

// Обновляем обработчик соединения Socket.IO
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("user_connected", (userData) => {
    if (userData && userData.id) {
      onlineUsers.set(socket.id, userData);
      socket.join(userData.id.toString());
      io.emit("users_online", Array.from(onlineUsers.values()));
    } else {
      console.error("Invalid userData:", userData);
    }
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

// Connect to MongoDB
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
