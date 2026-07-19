import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const required = ["JWT_SECRET"] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is required in environment variables`);
  }
}

const parseTrustProxy = (value: string | undefined): boolean => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseNumber(process.env.PORT, 5000),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL ?? "file:./prisma/webchat.db",
  JWT_SECRET: process.env.JWT_SECRET as string,
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL ?? "15m",
  REFRESH_TOKEN_TTL_DAYS: parseNumber(process.env.REFRESH_TOKEN_TTL_DAYS, 7),
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true",
  /** When true, Express trusts one hop of X-Forwarded-* (compose nginx). */
  TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY),
};
