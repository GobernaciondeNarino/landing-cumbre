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

export type SceneTheme = "light" | "dark";

/**
 * De qué color es el papel, según el propio CSS.
 *
 * El tema vive en los tokens de `index.css`; la escena lo deduce de ahí en vez
 * de llevar su propia copia, así no hay dos fuentes de verdad que se puedan
 * contradecir. Si alguien cambia `--color-abyss`, WebGL le sigue.
 */
export function detectTheme(): SceneTheme {
  if (typeof window === "undefined" || typeof document === "undefined") return "light";
  const fondo = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-abyss")
    .trim();
  const rgb = parseColor(fondo);
  if (!rgb) return "light";
  const [r, g, b] = rgb;
  // Luminancia perceptual rápida: por encima de la mitad, el papel es claro.
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5 ? "light" : "dark";
}

function parseColor(value: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const d = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    return [parseInt(d.slice(0, 2), 16), parseInt(d.slice(2, 4), 16), parseInt(d.slice(4, 6), 16)];
  }
  const fn = /^rgba?\(([^)]+)\)$/i.exec(value);
  if (fn) {
    const parts = fn[1].split(/[,/\s]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
      return [parts[0], parts[1], parts[2]];
    }
  }
  return null;
}
