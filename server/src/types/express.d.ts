import type { AuthenticatedUser } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      cookies?: Record<string, string | undefined>;
    }
  }
}

export {};
