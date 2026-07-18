import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/__tests__/**/*.test.ts"],
    reporters: ["default"],
    // Shared SQLite test DB + migrate deploy race under file parallelism.
    fileParallelism: false,
    testTimeout: 30_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/generated/**",
        "src/**/*.test.ts",
        "src/__tests__/**",
        "src/types/**",
        "src/index.ts",
      ],
      reporter: ["text-summary", "lcov"],
      // Regression floor, slightly below current (st 82 / br 64 / fn 92 / ln 84).
      thresholds: {
        statements: 78,
        branches: 58,
        functions: 85,
        lines: 80,
      },
    },
    env: {
      JWT_SECRET: "test-jwt-secret-with-enough-length-012345",
      DATABASE_URL: "file:./prisma/test.db",
      CLIENT_URL: "http://localhost:5173",
      NODE_ENV: "test",
    },
  },
});
