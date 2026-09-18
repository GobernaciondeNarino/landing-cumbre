import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // La plantilla HTML de la aplicación vive con el resto del código. El
  // index.html de la raíz del repositorio es otra cosa: la página de producción,
  // que genera `wj-build-index.mjs` al terminar el build.
  root: "wj-includes",

  // Rutas relativas: el build funciona en la raíz del dominio o en cualquier
  // subcarpeta, sin tocar nada.
  base: "./",

  // Archivos estáticos (vídeos, logo, favicon); se copian a la raíz del build.
  publicDir: "../wj-content/uploads",

  plugins: [react(), tailwindcss()],

  build: {
    // Todo lo servible cuelga de wj-content/.
    outDir: "../wj-content/dist",
    // outDir queda fuera de `root`, así que hay que autorizar el vaciado.
    emptyOutDir: true,
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
