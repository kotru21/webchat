import type { RequestHandler } from "express";
import {
  blockUser,
  listBlockedUsers,
  unblockUser,
} from "../services/blockService.js";
import { createHttpError } from "../utils/errors.js";

const peerIdParam = (raw: unknown): string => {
  if (typeof raw !== "string" || !raw) {
    throw createHttpError(400, "Некорректный собеседник", "INVALID_PEER");
  }
  return raw;
};

export const listBlocks: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }
  const users = await listBlockedUsers(req.user.id);
  res.json(users);
};

export const createBlock: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }
  await blockUser(req.user.id, peerIdParam(req.params.userId));
  res.status(204).send();
};

export const removeBlock: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }
  await unblockUser(req.user.id, peerIdParam(req.params.userId));
  res.status(204).send();
};
