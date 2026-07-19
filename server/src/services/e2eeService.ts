import prisma from "../config/prisma.js";
import { createHttpError } from "../utils/errors.js";
import { validateAndMinimizePublicJwk } from "../utils/e2eeJwk.js";

export const getPublicKey = async (userId: string) => {
  const row = await prisma.e2eeKey.findUnique({
    where: { userId },
    select: { userId: true, publicKeyJwk: true, updatedAt: true },
  });
  if (!row) {
    throw createHttpError(404, "Ключ E2EE не найден", "E2EE_KEY_NOT_FOUND");
  }
  return {
    userId: row.userId,
    publicKeyJwk: JSON.parse(row.publicKeyJwk) as {
      kty: string;
      crv: string;
      x: string;
      y: string;
    },
    updatedAt: row.updatedAt,
  };
};

export const upsertOwnPublicKey = async (
  userId: string,
  publicKeyJwk: unknown
) => {
  const validated = validateAndMinimizePublicJwk(publicKeyJwk);
  if (!validated.ok) {
    throw createHttpError(400, "Некорректный публичный ключ", "INVALID_KEY");
  }

  const row = await prisma.e2eeKey.upsert({
    where: { userId },
    create: { userId, publicKeyJwk: validated.jwkJson },
    update: { publicKeyJwk: validated.jwkJson },
    select: { userId: true, publicKeyJwk: true, updatedAt: true },
  });

  return {
    userId: row.userId,
    publicKeyJwk: JSON.parse(row.publicKeyJwk) as {
      kty: string;
      crv: string;
      x: string;
      y: string;
    },
    updatedAt: row.updatedAt,
  };
};
