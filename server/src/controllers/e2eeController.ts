import type { RequestHandler } from "express";
import { getPublicKey, upsertOwnPublicKey } from "../services/e2eeService.js";
import { createHttpError } from "../utils/errors.js";

export const getE2eeKey: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }
  const userId = req.params.userId;
  if (typeof userId !== "string" || !userId) {
    throw createHttpError(400, "Некорректный пользователь", "INVALID_PEER");
  }
  const key = await getPublicKey(userId);
  res.json(key);
};

export const putE2eeKey: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }
  const body = req.body as { publicKeyJwk?: unknown };
  const key = await upsertOwnPublicKey(req.user.id, body.publicKeyJwk);
  res.json(key);
};
