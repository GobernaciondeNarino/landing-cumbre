import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Rutas relativas: el build funciona en httpdocs o en cualquier subcarpeta de Plesk.
  base: "./",
  // Los archivos estáticos (vídeos, favicon) viven en wj-content/uploads y se
  // copian tal cual a la raíz de dist/ al compilar.
  publicDir: "wj-content/uploads",
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // three.js pesa más que el resto de la app junta y sólo hace falta
        // cuando la escena WebGL arranca: en su propio chunk se descarga en
        // paralelo y no retrasa el primer pintado de la landing.
        manualChunks: {
          three: ["three"],
        },
      },
    },
  },
});
