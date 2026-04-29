import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const backendOrigin = (env.VITE_BACKEND_ORIGIN || "http://127.0.0.1:8001").replace(/\/+$/, "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: backendOrigin,
          changeOrigin: true,
        },
        "/static": {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
    },
  };
});
