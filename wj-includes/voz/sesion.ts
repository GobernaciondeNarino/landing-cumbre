import type { SessionConfig } from "@elevenlabs/react";
import { AGENTE_VOZ_ID, ENDPOINT_TOKEN_VOZ, VOZ } from "../../wj-content/wj-voz";

interface RespuestaVoz {
  token?: string;
  signedUrl?: string;
  signed_url?: string;
  agentId?: string;
  error?: string;
}

/**
 * Cómo se abre la conversación.
 *
 * La decisión no se toma aquí: se le pregunta al servidor, que es donde vive la
 * configuración. El endpoint responde de una de tres formas y cada una lleva a
 * un modo de conexión distinto — ninguno de ellos pone la clave en el
 * navegador, que es el punto de todo esto:
 *
 *  · `token`     → agente privado por WebRTC. El servidor gastó la clave por
 *                  nosotros y nos dio un permiso que caduca.
 *  · `signedUrl` → lo mismo, por WebSocket.
 *  · `agentId`   → agente público. El ID identifica al agente pero no autoriza
 *                  a gastar nada, así que puede viajar tal cual.
 *
 * `AGENTE_VOZ_ID` es un atajo para desplegar sin PHP: si está relleno, manda y
 * nos ahorramos el viaje.
 */
export async function construirSesion(): Promise<SessionConfig | null> {
  if (AGENTE_VOZ_ID) {
    return { agentId: AGENTE_VOZ_ID, connectionType: "webrtc" };
  }
  if (!ENDPOINT_TOKEN_VOZ) return null;

  let respuesta: Response;
  try {
    respuesta = await fetch(ENDPOINT_TOKEN_VOZ, { headers: { Accept: "application/json" } });
  } catch {
    // Ni siquiera se pudo llegar al endpoint: no hay PHP, o no hay red.
    throw new Error(VOZ.sinConfigurar);
  }

  // Un 404 —el endpoint no existe— no trae JSON; un 503 del propio endpoint sí,
  // y su mensaje es más útil que cualquier cosa que pudiéramos inventar aquí.
  const datos = await respuesta
    .json()
    .then((d) => d as RespuestaVoz)
    .catch(() => null);

  if (!respuesta.ok) {
    throw new Error(datos?.error || VOZ.sinConfigurar);
  }
  if (datos?.token) {
    return { conversationToken: datos.token, connectionType: "webrtc" };
  }
  const firmada = datos?.signedUrl ?? datos?.signed_url;
  if (firmada) {
    return { signedUrl: firmada, connectionType: "websocket" };
  }
  if (datos?.agentId) {
    return { agentId: datos.agentId, connectionType: "webrtc" };
  }
  return null;
}

/**
 * Pide el micrófono antes de abrir la sesión.
 *
 * El SDK también lo pediría, pero hacerlo aquí permite distinguir «el visitante
 * dijo que no» de «falló la conexión», que son dos problemas distintos y se
 * arreglan de forma distinta.
 */
export async function pedirMicrofono(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices) return false;
  try {
    const flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
    // El SDK abre el suyo: éste sólo servía para provocar el diálogo de permiso.
    flujo.getTracks().forEach((pista) => pista.stop());
    return true;
  } catch {
    return false;
  }
}
