import argon2 from "argon2";
import bcrypt from "bcryptjs";

/** OWASP-recommended argon2id parameters (19 MiB, timeCost 2, parallelism 1). */
export const ARGON2_OPTS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export const hashPassword = async (plain: string): Promise<string> => {
  return argon2.hash(plain, ARGON2_OPTS);
};

export const verifyPassword = async (
  storedHash: string,
  plain: string
): Promise<boolean> => {
  if (storedHash.startsWith("$argon2")) {
    return argon2.verify(storedHash, plain);
  }
  if (storedHash.startsWith("$2")) {
    return bcrypt.compare(plain, storedHash);
  }
  return false;
};

export const needsRehash = (storedHash: string): boolean => {
  if (storedHash.startsWith("$2")) return true;
  if (storedHash.startsWith("$argon2")) {
    return argon2.needsRehash(storedHash, ARGON2_OPTS);
  }
  return true;
};
