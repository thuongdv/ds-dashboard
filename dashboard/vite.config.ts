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
  server: {
    fs: {
      // Allow serving files from the parent directory's dws-report folder
      allow: [path.resolve(__dirname, "..")],
      strict: false,
    },
  },
  define: {
    // Make the dws-report path available as a constant
    __DWS_REPORT_PATH__: JSON.stringify(path.resolve(__dirname, "../dws-report/reports")),
  },
});
