// ============================================================================
// ENLACES Y ARCHIVOS — edita aquí las URLs de botones, vídeos y contacto.
// ============================================================================

/**
 * Formulario externo de inscripción (Google Forms u otro).
 * Mientras esté vacío, el botón de inscripción aparece deshabilitado;
 * al pegar aquí la URL queda activo y abre en pestaña nueva.
 */
export const FORM_URL = "";

/**
 * Vídeos de la página. Los archivos físicos viven en
 * wj-content/uploads/videos/ y el build los copia a dist/videos/.
 * Para usar un CDN externo, sustituye la ruta por la URL directa al .mp4.
 */
export const VIDEO_PRINCIPAL_URL = `${import.meta.env.BASE_URL}videos/cumbre-principal.mp4`;
export const VIDEO_SECUENCIA_URL = `${import.meta.env.BASE_URL}videos/cumbre-secuencia.mp4`;

/** Datos de contacto del pie de página. */
export const CONTACTO = {
  correo: "hosting@narino.gov.co",
  web: "https://narino.gov.co",
  webEtiqueta: "narino.gov.co",
} as const;
