import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      "@horusvis-web": fileURLToPath(new URL("../shared/HorusVisWeb", import.meta.url)),
    },
  },
});
