import { useEffect, useRef, useState } from "react";
import { useReducedMotion, type MotionValue } from "motion/react";
import { CumbreScene, type SceneVariant } from "../webgl/CumbreScene";
import { isWebGLAvailable } from "../webgl/support";

interface WebGLStageProps {
  /** El <video> scrubbeado que alimenta la textura. */
  video: HTMLVideoElement | null;
  variant: SceneVariant;
  /** Progreso de scroll del escenario, en [0, 1]. */
  progress: MotionValue<number>;
  /** Opacidad de entrada de la figura (la usa el escenario de secuencia). */
  opacity?: MotionValue<number>;
  glowColor: string;
  glowIntensity: number;
  glowSize: number;
  className?: string;
  /**
   * Avisa al escenario de si WebGL se hizo cargo del vídeo. Mientras sea
   * `false` el escenario sigue pintando el <video> del DOM como siempre.
   * Debe venir memoizado con `useCallback`.
   */
  onActiveChange?: (active: boolean) => void;
}

/**
 * Puente entre React y la escena three.js.
 *
 * No renderiza nada si el navegador no tiene WebGL o si el sistema pide
 * movimiento reducido: en ambos casos el escenario se queda con su <video>
 * y `onActiveChange(false)` se lo confirma. El bucle sólo corre cuando el
 * escenario está en pantalla y la pestaña visible.
 */
export default function WebGLStage({
  video,
  variant,
  progress,
  opacity,
  glowColor,
  glowIntensity,
  glowSize,
  className,
  onActiveChange,
}: WebGLStageProps) {
  const prefersReducedMotion = useReducedMotion();
  const [supported] = useState(isWebGLAvailable);
  const [active, setActive] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<CumbreScene | null>(null);

  const enabled = supported && prefersReducedMotion !== true;

  // --- ciclo de vida de la escena -------------------------------------------
  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let scene: CumbreScene;
    try {
      scene = new CumbreScene({
        canvas,
        variant,
        // Si el navegador tira el contexto (cambio de GPU, memoria), el
        // escenario recupera el <video> del DOM sin que se note un hueco.
        onContextLost: () => setActive(false),
      });
    } catch {
      return;
    }
    sceneRef.current = scene;

    const rect = container.getBoundingClientRect();
    scene.resize(rect.width, rect.height);
    setActive(true);

    const resizeObserver = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) scene.resize(box.width, box.height);
    });
    resizeObserver.observe(container);

    // El escenario de secuencia mide varias pantallas de alto: fuera de vista
    // el bucle se para y deja la GPU y la batería en paz.
    let inView = true;
    const syncLoop = () => {
      if (inView && document.visibilityState === "visible") scene.start();
      else scene.stop();
    };
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        syncLoop();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(container);
    document.addEventListener("visibilitychange", syncLoop);
    syncLoop();

    const handlePointer = (event: PointerEvent) => {
      const box = container.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return;
      scene.setPointer(
        ((event.clientX - box.left) / box.width) * 2 - 1,
        -(((event.clientY - box.top) / box.height) * 2 - 1),
      );
    };
    window.addEventListener("pointermove", handlePointer, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointer);
      document.removeEventListener("visibilitychange", syncLoop);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      scene.dispose();
      sceneRef.current = null;
      setActive(false);
    };
  }, [enabled, variant]);

  // --- entradas que cambian con el tiempo -----------------------------------
  useEffect(() => {
    if (!active) return;
    sceneRef.current?.setVideo(video);
  }, [active, video]);

  useEffect(() => {
    if (!active) return;
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setPalette(glowColor);
    // Los mandos del Ambient Glow Studio (0.5–2 y 40–150) mueven ahora el aura
    // del shader, que es la que sustituye a los blur blobs de CSS.
    scene.setAura(0.16 * glowIntensity, glowSize / 110);
  }, [active, glowColor, glowIntensity, glowSize]);

  useEffect(() => {
    if (!active) return;
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setProgress(progress.get());
    return progress.on("change", (value) => scene.setProgress(value));
  }, [active, progress]);

  useEffect(() => {
    if (!active) return;
    const scene = sceneRef.current;
    if (!scene) return;
    if (!opacity) {
      scene.setOpacity(1);
      return;
    }
    scene.setOpacity(opacity.get());
    return opacity.on("change", (value) => scene.setOpacity(value));
  }, [active, opacity]);

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  if (!enabled) return null;

  return (
    <div ref={containerRef} aria-hidden="true" className={className}>
      <canvas ref={canvasRef} className="block size-full" />
    </div>
  );
}
