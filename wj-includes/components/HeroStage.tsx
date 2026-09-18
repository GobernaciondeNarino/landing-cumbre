import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import HeroTitle from "./HeroTitle";
import LeftInfoBlock from "./LeftInfoBlock";
import RightInfoBlock from "./RightInfoBlock";
import GyroToggle from "./GyroToggle";
// La escena arrastra three.js: se carga aparte para no retrasar el primer
// pintado. Hasta que llega, el escenario pinta el <video> del DOM.
const WebGLStage = lazy(() => import("./WebGLStage"));
import { useVideoScrub } from "../hooks/useVideoScrub";
import { useGyroscope } from "../hooks/useGyroscope";
import { VIDEO_PRINCIPAL_URL } from "../../wj-content/wj-enlaces";

interface HeroStageProps {
  ambientGlowColor: string;
  glowSize: number;
  glowIntensity: number;
}

/** Duración del clip del personaje principal, por si los metadatos tardan. */
const DURACION_PRINCIPAL = 5.04;

/**
 * Punto de interés horizontal del encuadre, en [0, 1].
 *
 * El clip tiene a la figura a un tercio por la izquierda y dos tercios de
 * plató a la derecha. Recortando por el centro, una pantalla vertical la deja
 * fuera y enseña fondo vacío; anclando el recorte aquí, la figura entra en
 * cuadro en cualquier proporción.
 */
const FOCO_PRINCIPAL = 0.27;

export default function HeroStage({
  ambientGlowColor,
  glowSize,
  glowIntensity,
}: HeroStageProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { videoRef, videoDuration, seekToProgress, videoHandlers } =
    useVideoScrub(DURACION_PRINCIPAL);

  // El <video> se entrega a three.js como textura; hace falta el nodo en estado,
  // no sólo en la ref, para que la escena se entere de cuándo aparece.
  const [videoNode, setVideoNode] = useState<HTMLVideoElement | null>(null);
  const [webglActive, setWebglActive] = useState(false);

  const attachVideo = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      setVideoNode(node);
    },
    [videoRef],
  );

  const hasFinePointer = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches,
    [],
  );

  // Scrub suavizado: el ratón solo fija un objetivo; un bucle rAF interpola
  // hacia él con easing exponencial, igual que las webs de scrub tipo WebGL.
  // Así el vídeo nunca recibe más seeks de los que puede decodificar y el
  // movimiento se siente amortiguado en lugar de saltar con cada mousemove.
  const targetProgressRef = useRef(0.5);
  const currentProgressRef = useRef(0.5);

  // Mando por inclinación para móvil: sustituye al ratón, que allí no existe.
  const tilt = useMotionValue(0);
  const alInclinar = useCallback(
    (valor: number) => {
      tilt.set(valor);
      // Mismo mapeo que el cursor: el recorrido útil cubre el clip entero.
      targetProgressRef.current = (valor + 1) / 2;
    },
    [tilt],
  );
  const giroscopio = useGyroscope(alInclinar);

  useEffect(() => {
    if ((!hasFinePointer && !giroscopio.activo) || prefersReducedMotion) return;
    let raf = 0;
    const tick = () => {
      const current = currentProgressRef.current;
      const target = targetProgressRef.current;
      const next = current + (target - current) * 0.09;
      if (Math.abs(next - current) > 0.0004) {
        currentProgressRef.current = next;
        seekToProgress(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasFinePointer, giroscopio.activo, prefersReducedMotion, seekToProgress]);

  // En táctil el hero se scrubbea con su propio scroll; también alimenta el
  // fundido de salida hacia el primer capítulo.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    // Con el giroscopio encendido manda la inclinación: si el scroll siguiera
    // buscando fotograma, los dos se pelearían por el mismo vídeo.
    if (!hasFinePointer && !prefersReducedMotion && !giroscopio.activo) {
      seekToProgress(p);
    }
  });

  // Fundido de salida del banner: al hacer scroll hacia el primer capítulo la
  // escena se oscurece progresivamente mientras el vídeo de secuencia aparece.
  const exitOverlayOpacity = useTransform(scrollYProgress, [0.2, 0.9], [0, 1]);

  useEffect(() => {
    if (prefersReducedMotion && videoDuration) {
      seekToProgress(0.5);
    }
  }, [prefersReducedMotion, videoDuration, seekToProgress]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hasFinePointer || prefersReducedMotion) return;
    const hero = heroRef.current;
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    // La zona cómoda [0.1, 0.9] del ancho se mapea a [0, 1] del vídeo.
    const progress = (percentage - 0.1) / 0.8;
    targetProgressRef.current = Math.max(0, Math.min(1, progress));
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      aria-label="Cumbre IA Nariño — escena principal"
      className="relative h-screen overflow-hidden flex flex-col justify-between"
    >
      {/* z-0 · capa ambiente */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 stage-bg" />
        <div className="absolute inset-0 grid-bg opacity-60 mix-blend-overlay" />
        {/* Los blur blobs sólo entran cuando no hay WebGL: con la escena activa
            el halo lo pinta el aura del shader, que además sigue al puntero. */}
        {!prefersReducedMotion && !webglActive && (
          <>
            <motion.div
              className="absolute left-0 top-[20%] rounded-full filter blur-[100px]"
              style={{
                width: `${55 * glowIntensity}%`,
                height: `${55 * glowIntensity}%`,
                background: `radial-gradient(circle, ${ambientGlowColor} 0%, rgba(255,255,255,0) 70%)`,
                transform: `translate(-25%, 15%) scale(${glowSize / 100})`,
              }}
              animate={{ scale: [1, 1.05, 1], opacity: [0.7, 0.85, 0.7] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-0 top-[25%] rounded-full filter blur-[110px]"
              style={{
                width: `${50 * glowIntensity}%`,
                height: `${50 * glowIntensity}%`,
                background:
                  "radial-gradient(circle, rgba(0, 158, 219, 0.35) 0%, rgba(255,255,255,0) 70%)",
                transform: `translate(25%, -10%) scale(${glowSize / 100})`,
              }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.75, 0.9, 0.75] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </>
        )}
        <div className="absolute inset-0 stage-fade" />
      </div>

      {/* z-20 · título. Sobre papel blanco el plano de la figura se pinta
          opaco, así que el texto va por encima; la figura entra por la
          izquierda del encuadre y el titular vive en el margen derecho. */}
      <div className="absolute inset-x-0 top-[16%] md:top-[14%] z-20 select-none pointer-events-none">
        <HeroTitle />
      </div>

      {/* z-10 · vídeo scrubbeado por ratón, centrado a ancho completo.
          Con WebGL activo sigue en el DOM y decodificando — es la fuente de la
          textura — pero quien pinta es el lienzo de al lado. */}
      <video
        ref={attachVideo}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        style={{ objectPosition: `${FOCO_PRINCIPAL * 100}% center` }}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 ${
          webglActive ? "opacity-0" : "opacity-95"
        }`}
        {...videoHandlers}
      >
        <source src={VIDEO_PRINCIPAL_URL} type="video/mp4" />
      </video>

      {/* z-10 · escena three.js: campo de partículas + personaje con shader */}
      <Suspense fallback={null}>
        <WebGLStage
          video={videoNode}
          variant="hero"
          progress={scrollYProgress}
          glowColor={ambientGlowColor}
          glowIntensity={glowIntensity}
          glowSize={glowSize}
          focusX={FOCO_PRINCIPAL}
          tilt={giroscopio.activo ? tilt : undefined}
          onActiveChange={setWebglActive}
          className="absolute inset-0 z-10 pointer-events-none"
        />
      </Suspense>

      {/* z-15 · velo inferior: el texto del pie cae sobre la figura en pantallas
          estrechas, y sobre blanco la tinta negra necesita papel debajo. */}
      <div aria-hidden="true" className="absolute inset-0 z-[15] pointer-events-none stage-fade-bottom" />

      {/* z-20 · contenido inferior */}
      <div className="relative z-20 mt-auto w-full">
        {/* Todo el texto se apila en el margen derecho, lejos de la figura. */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:pr-20 pb-8 md:pb-10 flex flex-col gap-6 lg:items-end">
          <LeftInfoBlock />
          <RightInfoBlock />
        </div>
      </div>

      <GyroToggle
        estado={giroscopio.estado}
        onToggle={() => (giroscopio.activo ? giroscopio.desactivar() : void giroscopio.activar())}
      />

      {/* z-30 · fundido de salida hacia el primer capítulo */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: exitOverlayOpacity }}
        className="absolute inset-0 z-30 bg-abyss pointer-events-none"
      />
    </section>
  );
}
