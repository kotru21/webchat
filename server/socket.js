import { Server } from "socket.io";

let io;

export const initializeSocket = (httpServer, corsOptions) => {
  io = new Server(httpServer, {
    cors: corsOptions,
  });

  return io;
};

// Функция для отправки уведомления о смене статуса
export const emitStatusChange = (userId, status, lastActivity) => {
  if (io) {
    io.emit("userStatusChanged", {
      userId,
      status,
      lastActivity,
    });
  }
};

// Экспортируем io для прямого доступа, если необходимо
export { io };
