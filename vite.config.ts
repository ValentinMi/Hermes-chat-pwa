import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

// Le proxy Hono tourne sur API_PORT (8787 par défaut) en dev ;
// Vite proxifie /api vers lui pour avoir les cookies/SSE en same-origin.
const API_PORT = process.env.API_PORT ?? "8787";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Hermes Chat",
        short_name: "Hermes",
        description: "Discuter avec un agent Hermes (Nous Research).",
        theme_color: "#0b0e14",
        background_color: "#0b0e14",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Ne jamais mettre en cache les appels API (chat en streaming).
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
});
