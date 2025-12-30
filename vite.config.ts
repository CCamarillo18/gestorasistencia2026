import path from "path";
import fs from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [
    ...mochaPlugins(process.env as any),
    react(),
    cloudflare(),
    {
      name: "copy-404-fallback",
      closeBundle() {
        try {
          const outDir = path.resolve(__dirname, "dist");
          const indexPath = path.join(outDir, "index.html");
          const notFoundPath = path.join(outDir, "404.html");
          const clientDir = path.join(outDir, "client");
          const clientIndex = path.join(clientDir, "index.html");
          const clientNotFound = path.join(clientDir, "404.html");
          const redirectsSrc = path.resolve(__dirname, "public", "_redirects");
          const redirectsDist = path.join(outDir, "_redirects");
          const redirectsClient = path.join(clientDir, "_redirects");
          if (!fs.existsSync(clientDir)) fs.mkdirSync(clientDir, { recursive: true });
          if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, notFoundPath);
            fs.copyFileSync(indexPath, clientIndex);
            fs.copyFileSync(indexPath, clientNotFound);
          }
          if (fs.existsSync(redirectsSrc)) {
            fs.copyFileSync(redirectsSrc, redirectsDist);
            fs.copyFileSync(redirectsSrc, redirectsClient);
          }
        } catch {
          // no-op
        }
      },
    },
  ],
  base: "/",
  server: {
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 5000,
    outDir: "dist",
    assetsDir: "assets",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
