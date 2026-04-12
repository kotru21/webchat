import type { RequestHandler } from "express";
import { getUserChatsList } from "../services/chatService.js";
import { createHttpError } from "../utils/errors.js";

export const getUserChats: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }

  const chats = await getUserChatsList(req.user.id);
  res.json(chats);
};
