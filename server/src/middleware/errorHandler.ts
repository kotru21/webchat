import { Prisma } from "../generated/prisma/client.js";
import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { env } from "../config/env.js";
import { isHttpError } from "../utils/errors.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    message: "Маршрут не найден",
    path: req.path,
  });
};

const UPLOAD_REJECT_MESSAGES = new Set([
  "Разрешены только изображения",
  "Неподдерживаемый формат файла",
]);

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (isHttpError(error)) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      details: error.details,
    });
  }

  if (error instanceof multer.MulterError) {
    const status =
      error.code === "LIMIT_FILE_SIZE" || error.code === "LIMIT_FIELD_VALUE"
        ? 413
        : 400;
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Файл слишком большой"
        : error.code === "LIMIT_FIELD_VALUE"
          ? "Поле слишком большое"
          : "Ошибка загрузки файла";
    return res.status(status).json({
      message,
      code: error.code,
    });
  }

  if (error instanceof Error && UPLOAD_REJECT_MESSAGES.has(error.message)) {
    return res.status(400).json({
      message: error.message,
      code: "UNSUPPORTED_FILE_TYPE",
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Конфликт уникального значения",
        code: "UNIQUE_CONSTRAINT_FAILED",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Запись не найдена",
        code: "RECORD_NOT_FOUND",
      });
    }
  }

  return res.status(500).json({
    message: "Что-то пошло не так!",
    code: "INTERNAL_SERVER_ERROR",
    error:
      env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : undefined,
  });
};
