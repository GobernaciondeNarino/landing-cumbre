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
});
