import { env } from "../config/env.js";

const MIN_JWT_SECRET_LENGTH = 32;

export const assertStrongSecretsOrThrow = (): void => {
  if (env.NODE_ENV !== "production") return;
  if (!env.JWT_SECRET || env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters in production`
    );
  }
  if (
    env.JWT_SECRET === "your_jwt_secret" ||
    env.JWT_SECRET === "your_jwt_secret_key"
  ) {
    throw new Error("JWT_SECRET is a known placeholder; refusing to start");
  }
};
