import { useEffect, useMemo, useRef } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import HeroTitle from "./HeroTitle";
import LeftInfoBlock from "./LeftInfoBlock";
import RightInfoBlock from "./RightInfoBlock";
import { useVideoScrub } from "../hooks/useVideoScrub";
import { VIDEO_PRINCIPAL_URL } from "../../wj-content/wj-enlaces";

interface HeroStageProps {
  ambientGlowColor: string;
  glowSize: number;
  glowIntensity: number;
}

export default function HeroStage({
  ambientGlowColor,
  glowSize,
  glowIntensity,
}: HeroStageProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { videoRef, videoDuration, seekToProgress, videoHandlers } = useVideoScrub(4.0);

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

  useEffect(() => {
    if (!hasFinePointer || prefersReducedMotion) return;
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
  }, [hasFinePointer, prefersReducedMotion, seekToProgress]);

  // En táctil el hero se scrubbea con su propio scroll; también alimenta el
  // fundido de salida hacia el primer capítulo.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!hasFinePointer && !prefersReducedMotion) seekToProgress(p);
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
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, #000a22 0%, #00133d 65%)" }}
        />
        <div className="absolute inset-0 grid-bg opacity-60 mix-blend-overlay" />
        {!prefersReducedMotion && (
          <>
            <motion.div
              className="absolute left-0 top-[20%] rounded-full filter blur-[100px]"
              style={{
                width: `${55 * glowIntensity}%`,
                height: `${55 * glowIntensity}%`,
                background: `radial-gradient(circle, ${ambientGlowColor} 0%, rgba(0,19,61,0) 70%)`,
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
                  "radial-gradient(circle, rgba(0, 158, 219, 0.35) 0%, rgba(0,19,61,0) 70%)",
                transform: `translate(25%, -10%) scale(${glowSize / 100})`,
              }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.75, 0.9, 0.75] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-abyss via-transparent to-abyss opacity-90" />
      </div>

      {/* z-5 · título, por debajo del vídeo para que la figura lo recorra */}
      <div className="absolute inset-x-0 top-[16%] md:top-[14%] z-[5] select-none pointer-events-none">
        <HeroTitle />
      </div>

      {/* z-10 · vídeo scrubbeado por ratón, centrado a ancho completo */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-95 mix-blend-screen pointer-events-none z-10"
        {...videoHandlers}
      >
        <source src={VIDEO_PRINCIPAL_URL} type="video/mp4" />
      </video>

      {/* z-20 · contenido inferior */}
      <div className="relative z-20 mt-auto w-full">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:pr-20 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 md:pb-10 items-end">
          <LeftInfoBlock />
          <RightInfoBlock />
        </div>
      </div>

      {/* z-30 · fundido de salida hacia el primer capítulo */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: exitOverlayOpacity }}
        className="absolute inset-0 z-30 bg-abyss pointer-events-none"
      />
    </section>
  );
}
