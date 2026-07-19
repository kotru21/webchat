import type { RequestHandler } from "express";
import prisma from "../config/prisma.js";
import { isAccessTokenRevoked } from "../services/tokenRevocation.js";
import { verifyAccessToken } from "../utils/tokens.js";

const protect: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Не авторизован, токен отсутствует" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Не авторизован, токен отсутствует" });
  }

  try {
    const payload = verifyAccessToken(token);

    if (isAccessTokenRevoked(payload)) {
      return res.status(401).json({ message: "Сессия завершена" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Пользователь не найден" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    };

    next();
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TokenExpiredError"
        ? "Срок действия токена истек"
        : "Невалидный токен";

    return res.status(401).json({ message });
  }
};

export default protect;
