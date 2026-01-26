import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
  },
  resolve: {
    alias: {
      // Alias for static assets served from parent directory
      "@dws-report": path.resolve(__dirname, "../dws-report"),
    },
  },
  server: {
    fs: {
      // Allow serving files from the parent directory's dws-report folder
      allow: [path.resolve(__dirname, "..")],
    },
  },
});
