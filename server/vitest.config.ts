import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/__tests__/**/*.test.ts"],
    reporters: ["default"],
    testTimeout: 30_000,
    env: {
      JWT_SECRET: "test-jwt-secret-with-enough-length-012345",
      DATABASE_URL: "file:./prisma/test.db",
      CLIENT_URL: "http://localhost:5173",
      NODE_ENV: "test",
    },
  },
});
