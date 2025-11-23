import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 移除 envDir 設定，Vite 預設就會讀取當前目錄的 .env
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
