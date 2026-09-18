import type { SessionConfig } from "@elevenlabs/react";
import { AGENTE_VOZ_ID, ENDPOINT_TOKEN_VOZ } from "../../wj-content/wj-voz";

/**
 * Cómo se abre la conversación, según lo que haya configurado.
 *
 * Dos caminos, y ninguno pasa por poner la clave en el navegador:
 *
 *  · **Agente público** — basta el `agentId`. El ID identifica al agente pero
 *    no autoriza nada: es el modo pensado justo para sitios estáticos como
 *    éste, donde no hay servidor propio que guarde un secreto.
 *
 *  · **Agente privado** — el navegador pide un token a un endpoint nuestro; el
 *    endpoint lo pide a ElevenLabs con la clave, que sólo existe allí, y
 *    devuelve un token efímero. Ver `api/voz-token.php`.
 */
export async function construirSesion(): Promise<SessionConfig | null> {
  if (ENDPOINT_TOKEN_VOZ) {
    const respuesta = await fetch(ENDPOINT_TOKEN_VOZ, {
      headers: { Accept: "application/json" },
    });
    if (!respuesta.ok) {
      throw new Error(`El endpoint de voz respondió ${respuesta.status}`);
    }
    const datos = (await respuesta.json()) as {
      token?: string;
      signedUrl?: string;
      signed_url?: string;
    };
    if (datos.token) {
      return { conversationToken: datos.token, connectionType: "webrtc" };
    }
    const firmada = datos.signedUrl ?? datos.signed_url;
    if (firmada) {
      return { signedUrl: firmada, connectionType: "websocket" };
    }
    throw new Error("El endpoint de voz no devolvió ni token ni URL firmada");
  }

  if (AGENTE_VOZ_ID) {
    return { agentId: AGENTE_VOZ_ID, connectionType: "webrtc" };
  }

  return null;
}

/** ¿Hay algo configurado con lo que conectar? */
export function hayAgenteConfigurado(): boolean {
  return Boolean(ENDPOINT_TOKEN_VOZ || AGENTE_VOZ_ID);
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
