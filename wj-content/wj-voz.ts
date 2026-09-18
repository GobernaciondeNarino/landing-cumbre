// ============================================================================
// ASISTENTE DE VOZ — configuración del agente de ElevenLabs.
//
//  AQUÍ NO VA NINGUNA CLAVE DE API. NUNCA.
//
// Este archivo se compila dentro de dist/ y se sirve al público. Cualquiera
// puede abrir el JavaScript del sitio y leer lo que haya escrito aquí, igual
// que se lee el HTML. Una clave de ElevenLabs puesta en el navegador es una
// clave regalada: quien la copie gasta los créditos de la entidad.
//
// La clave vive en el servidor. Cómo y dónde: wj-admin/VOZ.md.
// ============================================================================

/**
 * Endpoint propio al que el sitio le pregunta cómo conectarse.
 *
 * **Esto es lo único que hay que saber aquí.** La configuración del asistente
 * —qué agente y, si hace falta, con qué clave— vive en el SERVIDOR, y el sitio
 * se la pregunta a este endpoint cada vez que alguien pulsa el micrófono. Así,
 * cambiar de agente o rotar la clave no obliga a recompilar ni a tocar el
 * repositorio: se cambia en el servidor y ya.
 *
 * La implementación está en `wj-content/api/voz-token.php` y admite cuatro
 * sitios donde poner esa configuración. Cuál usar, en `wj-admin/VOZ.md`.
 *
 * Vaciar esta constante apaga el asistente de voz; el chat escrito sigue.
 */
export const ENDPOINT_TOKEN_VOZ = "/wj-content/api/voz-token.php";

/**
 * Atajo opcional: ID de un agente **público** compilado en la propia web.
 *
 * No es un secreto —identifica al agente, no autoriza nada—, así que puede ir
 * aquí sin riesgo. Sirve para desplegar sin PHP, a cambio de tener que
 * recompilar cada vez que cambie.
 *
 * Si está relleno, manda sobre el endpoint y se evita el viaje al servidor.
 * Lo normal es dejarlo vacío y configurar en el servidor.
 */
export const AGENTE_VOZ_ID = "";

/** Textos del asistente. */
export const VOZ = {
  saludo:
    "¡Hola! Soy el asistente de la Cumbre IA Nariño. Escríbeme o pulsa el micrófono y hablamos.",
  botonHablar: "Hablar con el asistente",
  botonColgar: "Terminar la conversación",
  estadoConectando: "Conectando…",
  estadoEscuchando: "Te escucho",
  estadoHablando: "Hablando",
  estadoError: "No se pudo conectar con el asistente de voz",
  sinConfigurar: "El asistente de voz todavía no está configurado",
  sinMicrofono: "No se pudo usar el micrófono. Revisa el permiso del navegador.",
  respuestaLocal:
    "Gracias por escribir. Muy pronto este asistente responderá con la programación completa de la Cumbre. Mientras tanto, revisa los capítulos de la página y la sección de inscripción.",
} as const;
