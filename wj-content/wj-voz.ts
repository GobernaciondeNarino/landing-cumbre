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
 * ID del agente de ElevenLabs.
 *
 * NO es un secreto: identifica al agente, no autoriza nada por sí solo. Vale
 * para agentes **públicos**, que son los que aceptan conexiones del navegador
 * sin credenciales. Se copia del panel de ElevenLabs, en Agents → tu agente →
 * Agent ID, y el agente tiene que estar marcado como público.
 *
 * Mientras esté vacío, el botón del micrófono explica que el asistente de voz
 * todavía no está configurado y el chat escrito sigue funcionando.
 */
export const AGENTE_VOZ_ID = "";

/**
 * Endpoint **propio** que entrega un token efímero para hablar con el agente.
 *
 * Es la alternativa para agentes **privados**: el navegador pide un token a
 * este endpoint, el endpoint lo pide a ElevenLabs con la clave —que sólo
 * existe en el servidor— y devuelve únicamente el token, que caduca.
 *
 * En el repositorio hay una implementación lista para Plesk en
 * `wj-content/api/voz-token.php`; con ella, aquí se pone
 * `"/wj-content/api/voz-token.php"`.
 *
 * Si está relleno, manda sobre `AGENTE_VOZ_ID`.
 */
export const ENDPOINT_TOKEN_VOZ = "";

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
