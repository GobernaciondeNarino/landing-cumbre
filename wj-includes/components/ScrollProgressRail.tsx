import { CHAPTERS } from "../../wj-content/wj-capitulos";

interface ScrollProgressRailProps {
  activeSection: number;
  onNavigate: (index: number) => void;
}

export default function ScrollProgressRail({ activeSection, onNavigate }: ScrollProgressRailProps) {
  return (
    <nav
      aria-label="Progreso de capítulos"
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-4"
    >
      {CHAPTERS.map((chapter, i) => (
        <button
          key={chapter.id}
          type="button"
          aria-label={`Ir al capítulo ${chapter.index}: ${chapter.title}`}
          aria-current={i === activeSection ? "step" : undefined}
          onClick={() => onNavigate(i)}
          className={`w-1.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky ${
            i === activeSection ? "h-8 bg-ember" : "h-1.5 bg-white/20 hover:bg-sky"
          }`}
        />
      ))}
    </nav>
  );
}
