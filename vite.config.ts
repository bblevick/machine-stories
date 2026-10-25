import { defineConfig } from "vitest/config";
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  server: {
    proxy: {
      "/agent": { target: "http://127.0.0.1:8766", changeOrigin: true },
    },
  },
  test: { include: ["tests/**/*.test.ts"] },
});
