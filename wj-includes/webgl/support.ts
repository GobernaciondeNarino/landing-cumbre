/**
 * ¿Puede este navegador mover la escena WebGL?
 *
 * La landing nunca depende de three.js: si esto devuelve `false` — WebGL
 * bloqueado, GPU en lista negra, navegador antiguo — los escenarios siguen
 * pintando el <video> con `mix-blend-screen` exactamente igual que antes.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    if (!gl) return false;
    // Libera el contexto de sondeo: los navegadores limitan cuántos hay vivos.
    const lose = (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context");
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Píxel ratio acotado: por encima de 2 el coste sube y la mejora no se ve. */
export function safePixelRatio(max = 2): number {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, max);
}
