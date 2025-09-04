import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./Models/userModel.js";
import { SOCKET_EVENTS } from "./src/shared/socketEvents.js";

let io;

export const initializeSocket = (httpServer, corsOptions) => {
  io = new Server(httpServer, { cors: corsOptions });

  // Auth middleware (handshake)
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (socket.handshake.headers?.authorization
          ? socket.handshake.headers.authorization.split(" ")[1]
          : undefined);

      if (!token) {
        // Разрешаем анонимное подключение (для обратной совместимости старого клиента)
        return next();
      }
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.id).select(
          "_id username email avatar status"
        );
        if (user) {
          socket.data.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            status: user.status,
          };
        }
      } catch {
        // При ошибке валидации токена не рвём соединение, просто без user
      }
      next();
    } catch {
      next(new Error("AUTH_FAILED"));
    }
  });

  return io;
};

// Функция для отправки уведомления о смене статуса
export const emitStatusChange = (userId, status, lastActivity) => {
  if (!io) return;
  io.emit(SOCKET_EVENTS.USER_STATUS_CHANGED, { userId, status, lastActivity });
};

// Экспортируем io для прямого доступа, если необходимо
export { io };
