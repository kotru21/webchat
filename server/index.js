import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { initializeSocket } from "./socket.js";
import { SOCKET_EVENTS } from "./src/shared/socketEvents.js";
import compression from "compression";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import statusRoutes from "./routes/statusRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import helmet from "helmet";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import User from "./Models/userModel.js";
import Status from "./Models/Status.js";
import { createMessage } from "./services/messageService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const httpServer = createServer(app);

// middleware
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

// доп CORS заголовки
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

// global limiter отключен

app.use(
  "/uploads",
  (req, res, next) => {
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// маршруты api
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/chats", chatRoutes);

// обработчик ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Что-то пошло не так!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// создание директорий
const ensureUploadsDir = async () => {
  const dirs = [
    path.join(__dirname, "uploads"),
    path.join(__dirname, "uploads", "avatars"),
    path.join(__dirname, "uploads", "banners"),
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

// socket.io init
const io = initializeSocket(httpServer, {
  origin: process.env.CLIENT_URL,
  methods: ["GET", "POST"],
  credentials: true,
});

app.set("io", io);

// онлайн пользователи (in-memory)
const onlineUsers = new Map();

// обработчик connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on(SOCKET_EVENTS.USER_CONNECTED, (userData) => {
    if (userData && userData.id) {
      onlineUsers.set(socket.id, userData);
      socket.join(userData.id.toString());
      const list = Array.from(onlineUsers.values());
      io.emit(SOCKET_EVENTS.USERS_ONLINE, list);
      io.emit("users_online", list); // legacy
    } else {
      console.error("Invalid userData:", userData);
    }
  });

  socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  // отправка сообщения через сокет
  socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload, cb) => {
    try {
      const { receiverId, content = "" } = payload || {};
      if (!content.trim() && !payload?.mediaUrl) {
        return cb?.({ error: "EMPTY" });
      }
      const userData =
        socket.data?.user ||
        Array.from(onlineUsers.values()).find(
          (u) => u.id && socket.rooms.has(u.id.toString())
        );
      if (!userData) return cb?.({ error: "NO_USER" });
      const isPrivate = !!receiverId;
      const messageData = {
        sender: userData.id,
        senderUsername: userData.username || userData.email,
        content,
        receiver: isPrivate ? receiverId : null,
        isPrivate,
      };
      const saved = await createMessage(messageData);
      if (isPrivate) {
        io.to(saved.sender._id.toString())
          .to(saved.receiver._id.toString())
          .emit(SOCKET_EVENTS.MESSAGE_NEW, saved);
        io.to(saved.sender._id.toString())
          .to(saved.receiver._id.toString())
          .emit("receive_private_message", saved); // legacy
      } else {
        io.to("general").emit(SOCKET_EVENTS.MESSAGE_NEW, saved);
        io.to("general").emit("receive_message", saved); // legacy
      }
      cb?.({ ok: true, id: saved._id });
    } catch (e) {
      console.error("socket message_send error", e);
      cb?.({ error: "SERVER" });
    }
  });

  socket.on("disconnect", async () => {
    try {
      const userData = onlineUsers.get(socket.id);
      if (userData && userData._id) {
        console.log(
          `User disconnected: ${userData.username || userData.email}`
        );

        // статус offline в БД
        await User.findByIdAndUpdate(userData._id, {
          status: "offline",
          lastActivity: new Date(),
        });

        // broadcast статуса
        const statusPayload = {
          userId: userData._id,
          status: "offline",
          lastActivity: new Date(),
        };
        io.emit(SOCKET_EVENTS.USER_STATUS_CHANGED, statusPayload);
        io.emit("userStatusChanged", statusPayload); // legacy
      }

      // удалить из онлайн
      onlineUsers.delete(socket.id);
      const list = Array.from(onlineUsers.values());
      io.emit(SOCKET_EVENTS.USERS_ONLINE, list);
      io.emit("users_online", list); // legacy
    } catch (error) {
      console.error("Error updating status on disconnect:", error);
      onlineUsers.delete(socket.id);
      const list = Array.from(onlineUsers.values());
      io.emit(SOCKET_EVENTS.USERS_ONLINE, list);
      io.emit("users_online", list); // legacy
    }
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
