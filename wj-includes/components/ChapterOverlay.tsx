import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { AVATARS, type Chapter } from "../../wj-content/wj-capitulos";

interface ChapterOverlayProps {
  chapter: Chapter;
  index: number;
  total: number;
  progress: MotionValue<number>;
  onHoverCta: () => void;
}

export default function ChapterOverlay({
  chapter,
  index,
  total,
  progress,
  onHoverCta,
}: ChapterOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const start = index / total;
  const end = (index + 1) / total;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  // Solape corto de entrada/salida; el primer y último capítulo no funden en su extremo.
  const opacityInput = [
    isFirst ? 0 : start,
    isFirst ? 0.001 : start + 0.06,
    isLast ? 0.999 : end - 0.06,
    isLast ? 1 : end,
  ];
  const opacityOutput = [isFirst ? 1 : 0, 1, 1, isLast ? 1 : 0];
  const opacity = useTransform(progress, opacityInput, opacityOutput);
  const y = useTransform(progress, [start, end], [24, -24]);
  const filter = useTransform(progress, opacityInput, [
    isFirst ? "blur(0px)" : "blur(8px)",
    "blur(0px)",
    "blur(0px)",
    isLast ? "blur(0px)" : "blur(8px)",
  ]);

  // Capítulos impares (01, 03, 05) a la izquierda; pares a la derecha.
  const alignRight = index % 2 === 1;

  return (
    <section
      aria-labelledby={`chapter-title-${chapter.id}`}
      className="absolute inset-0 z-20 pointer-events-none"
    >
      <motion.div
        style={
          prefersReducedMotion ? { opacity } : { opacity, y, filter }
        }
        className={`h-full max-w-7xl mx-auto px-6 md:px-12 flex items-center ${
          alignRight ? "md:justify-end" : "md:justify-start"
        } justify-center`}
      >
        <div className={`max-w-xl pointer-events-auto ${alignRight ? "md:text-right" : ""}`}>
          <p className="font-mono text-ember text-xs tracking-[0.3em] mb-3">{chapter.index}</p>
          <p className="text-white/40 text-xs uppercase tracking-[0.25em] mb-4">
            {chapter.kicker}
          </p>
          <h2
            id={`chapter-title-${chapter.id}`}
            className="font-display text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter mb-6"
          >
            {chapter.title}
          </h2>
          <p className="text-white/60 text-base leading-relaxed">{chapter.body}</p>

          {"services" in chapter && chapter.services && (
            <ul className={`mt-6 space-y-3 ${alignRight ? "md:ml-auto" : ""}`}>
              {chapter.services.map((service) => (
                <li
                  key={service}
                  className={`flex items-center gap-3 text-white/70 text-sm ${
                    alignRight ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-sky shrink-0" />
                  {service}
                </li>
              ))}
            </ul>
          )}

          {"showAvatars" in chapter && chapter.showAvatars && (
            <div
              className={`mt-6 flex items-center gap-4 ${alignRight ? "md:justify-end" : ""}`}
            >
              <div className="flex -space-x-3">
                {AVATARS.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="size-10 rounded-full border-2 border-abyss object-cover"
                  />
                ))}
              </div>
              <p className="font-mono text-xs text-white/40">
                <span className="text-amber">{chapter.avataresCifra}</span>{" "}
                {chapter.avataresNota}
              </p>
            </div>
          )}

          {"showCta" in chapter && chapter.showCta && (
            <a
              href="#inscripcion"
              onMouseEnter={onHoverCta}
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-ember px-8 py-4
                         font-display text-base font-bold text-abyss
                         transition-colors hover:bg-crimson hover:text-white
                         focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
            >
              {chapter.ctaTexto}
              <ArrowUpRight className="size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          )}
        </div>
      </motion.div>
    </section>
  );
}
