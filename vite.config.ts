// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const backendTarget = "http://180.93.43.146:3088";

const backendProxy = {
  "/api": {
    target: backendTarget,
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => path.replace(/^\/api/, "/v1/api"),
  },
  "/socket.io": {
    target: backendTarget,
    changeOrigin: true,
    // secure: false,
    // ws: true,
  },
};

export default defineConfig(({ mode }) => ({
  server: {
    allowedHosts: ["realtime-dev-chatapp-dnq2.vercel.app", "localhost"],
    host: "::",
    port: 8080,
    proxy: backendProxy,
  },
  preview: {
    proxy: backendProxy,
  },
  plugins: [
    react(),
    // mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
