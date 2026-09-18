// ============================================================================
// ENLACES Y ARCHIVOS — edita aquí las URLs de botones, vídeos y contacto.
// ============================================================================

/**
 * Página de inscripción y eventos de la Secretaría TIC.
 * Mientras esté vacía, el botón de inscripción aparece deshabilitado;
 * con una URL queda activo y abre en pestaña nueva.
 */
export const FORM_URL = "https://tic.narino.gov.co/eventos/";

/**
 * Dónde están los archivos estáticos compilados, visto desde el navegador.
 *
 * No se puede usar `import.meta.env.BASE_URL` a secas: vale "./" y se resuelve
 * contra el documento. Eso acierta cuando la página que carga es
 * wj-content/dist/index.html, pero no cuando la carga el index.html de la raíz
 * del despliegue — ahí "./videos/…" buscaría los vídeos en la raíz, donde no
 * están. La URL de este módulo, en cambio, siempre apunta a
 * wj-content/dist/assets/, así que subir un nivel da la base correcta con
 * cualquiera de las dos entradas y también en subcarpetas.
 *
 * En desarrollo no hay build: manda el servidor de Vite, que sirve
 * wj-content/uploads/ en la raíz.
 */
const BASE_ARCHIVOS = import.meta.env.DEV
  ? import.meta.env.BASE_URL
  : new URL(/* @vite-ignore */ "../", import.meta.url).href;

/**
 * Vídeos de la página. Los archivos físicos viven en
 * wj-content/uploads/videos/ y el build los copia a wj-content/dist/videos/.
 * Para usar un CDN externo, sustituye la ruta por la URL directa al .mp4.
 */
export const VIDEO_PRINCIPAL_URL = `${BASE_ARCHIVOS}videos/cumbre-principal.mp4`;
export const VIDEO_SECUENCIA_URL = `${BASE_ARCHIVOS}videos/cumbre-secuencia.mp4`;

/**
 * Logotipo horizontal de la Cumbre.
 *
 * El WebP pesa 39 kB frente a los 310 kB del PNG original, que se conserva
 * como maestro y hace de respaldo para navegadores que no lean WebP.
 */
export const LOGO_URL = `${BASE_ARCHIVOS}logohz.webp`;
export const LOGO_RESPALDO_URL = `${BASE_ARCHIVOS}logohz.png`;

/** Datos de contacto del pie de página. */
export const CONTACTO = {
  correo: "hosting@narino.gov.co",
  web: "https://narino.gov.co",
  webEtiqueta: "narino.gov.co",
} as const;
