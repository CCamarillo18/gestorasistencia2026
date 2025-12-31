import path from "path";
import fs from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";

/**
 * v2.1.52 - COMPATIBILIDAD VITE 7 + CLOUDFLARE (FIX TS6133)
 * - Detecta que Vite ya organiza las carpetas client/ y worker/.
 * - Genera el 404.html directamente en el destino correcto.
 * - Limpia estrictamente cualquier rastro de _redirects para evitar Error 10021.
 * - Eliminada variable 'clientRedirects' no utilizada para corregir error de compilación.
 */

export default defineConfig({
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...mochaPlugins(process.env as any),
    react(),
    cloudflare(),
    {
      name: "smart-spa-fix",
      closeBundle() {
        try {
          const outDir = path.resolve(process.cwd(), "dist");
          const clientDir = path.join(outDir, "client");
          const workerDir = path.join(outDir, "gestorasistencia_worker");
          
          // Esperamos que index.html ya esté en dist/client por Vite 7
          const clientIndex = path.join(clientDir, "index.html");
          const clientNotFound = path.join(clientDir, "404.html");

          // 1. Crear 404.html solo si el index existe en client
          if (fs.existsSync(clientIndex)) {
            fs.copyFileSync(clientIndex, clientNotFound);
            console.log("✅ 404.html (Fallback) generado en dist/client");
          }

          // 2. LIMPIEZA TOTAL DE _REDIRECTS
          // El Error 10021 ocurre cuando wrangler ve este archivo.
          // Como ya tenemos functions/[[path]].ts y 404.html, NO lo necesitamos.
          const pathsToClean = [outDir, clientDir, workerDir];
          pathsToClean.forEach(dir => {
            const file = path.join(dir, "_redirects");
            if (fs.existsSync(file)) {
              fs.unlinkSync(file);
              console.log(`🧹 Eliminado _redirects de ${path.basename(dir)} para evitar bucles.`);
            }
          });

        } catch (err) {
          // Fallo silencioso si los archivos ya fueron procesados
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
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
});