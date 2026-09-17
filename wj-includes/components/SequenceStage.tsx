import { useEffect, useRef, type Ref } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import ChapterOverlay from "./ChapterOverlay";
import { useVideoScrub } from "../hooks/useVideoScrub";
import { VIDEO_SECUENCIA_URL } from "../../wj-content/wj-enlaces";
import { CHAPTERS } from "../../wj-content/wj-capitulos";

interface SequenceStageProps {
  ref?: Ref<HTMLElement>;
  ambientGlowColor: string;
  glowSize: number;
  glowIntensity: number;
  onChapterChange: (index: number) => void;
  onHoverCta: () => void;
}

export default function SequenceStage({
  ref,
  ambientGlowColor,
  glowSize,
  glowIntensity,
  onChapterChange,
  onHoverCta,
}: SequenceStageProps) {
  const localRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const lastChapterRef = useRef(-1);
  const { videoRef, videoDuration, seekToProgress, videoHandlers } = useVideoScrub(20.0);

  const setRefs = (node: HTMLElement | null) => {
    localRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
  };

  const { scrollYProgress } = useScroll({
    target: localRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 40,
    mass: 0.6,
    restDelta: 0.0005,
  });

  useMotionValueEvent(smoothProgress, "change", (p) => {
    if (!prefersReducedMotion) seekToProgress(p);
  });

  // Contraparte del fundido de salida del banner: el vídeo de secuencia
  // aparece gradualmente durante el arranque del primer capítulo.
  const videoOpacity = useTransform(smoothProgress, [0, 0.05], [0, 0.95]);

  const chapterIndex = useTransform(smoothProgress, (p) =>
    Math.min(CHAPTERS.length - 1, Math.max(0, Math.floor(p * CHAPTERS.length))),
  );

  useMotionValueEvent(chapterIndex, "change", (i) => {
    if (i !== lastChapterRef.current) {
      lastChapterRef.current = i;
      onChapterChange(i);
      // Con movimiento reducido, cada capítulo fija un frame representativo.
      if (prefersReducedMotion) seekToProgress((i + 0.5) / CHAPTERS.length);
    }
  });

  useEffect(() => {
    if (prefersReducedMotion && videoDuration) {
      seekToProgress(0.5 / CHAPTERS.length);
    }
  }, [prefersReducedMotion, videoDuration, seekToProgress]);

  return (
    <section ref={setRefs} className="relative h-[400vh] md:h-[500vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Capa ambiente bajo el vídeo */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, #000a22 0%, #00133d 65%)" }}
          />
          {!prefersReducedMotion && (
            <motion.div
              className="absolute left-[10%] bottom-[10%] rounded-full filter blur-[110px]"
              style={{
                width: `${45 * glowIntensity}%`,
                height: `${45 * glowIntensity}%`,
                background: `radial-gradient(circle, ${ambientGlowColor} 0%, rgba(0,19,61,0) 70%)`,
                transform: `scale(${glowSize / 100})`,
              }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.75, 0.6] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>

        <motion.video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          style={{ opacity: prefersReducedMotion ? 0.95 : videoOpacity }}
          className="absolute inset-0 w-full h-full object-cover mix-blend-screen z-10"
          {...videoHandlers}
        >
          <source src={VIDEO_SECUENCIA_URL} type="video/mp4" />
        </motion.video>

        {/* Viñeta lateral para contraste de lectura */}
        <div className="absolute inset-0 z-[15] pointer-events-none bg-gradient-to-r from-abyss/85 via-transparent to-abyss/85" />

        {CHAPTERS.map((chapter, i) => (
          <ChapterOverlay
            key={chapter.id}
            chapter={chapter}
            index={i}
            total={CHAPTERS.length}
            progress={smoothProgress}
            onHoverCta={onHoverCta}
          />
        ))}
      </div>
    </section>
  );
}
