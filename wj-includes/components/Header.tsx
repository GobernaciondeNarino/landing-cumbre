import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, MessageCircle, Sparkles, X } from "lucide-react";
import { CHAPTERS } from "../../wj-content/wj-capitulos";
import { CABECERA } from "../../wj-content/wj-textos";

interface HeaderProps {
  activeSection: number;
  isMenuOpen: boolean;
  onMenuToggle: (open: boolean) => void;
  onNavigate: (index: number) => void;
  onOpenProject: () => void;
  onOpenChat: () => void;
}

export default function Header({
  activeSection,
  isMenuOpen,
  onMenuToggle,
  onNavigate,
  onOpenProject,
  onOpenChat,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > 40;
    setScrolled((prev) => (prev === next ? prev : next));
  });

  const activeChapter = CHAPTERS[activeSection];

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
          scrolled ? "bg-abyss/70 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="font-display font-black tracking-tighter text-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
          >
            {CABECERA.marca}
            <span className="text-ember">·</span>
            {CABECERA.marcaSufijo}
            <span className="ml-2 font-mono text-[10px] font-normal tracking-[0.25em] text-white/40 uppercase">
              {CABECERA.marcaNota}
            </span>
          </a>

          <div className="hidden md:block">
            <AnimatePresence mode="wait">
              <motion.p
                key={activeChapter.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="font-mono text-xs text-sky"
              >
                {activeChapter.index} · {activeChapter.title}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenChat}
              aria-label="Abrir asistente de la Cumbre"
              className="p-2 text-white/60 hover:text-sky transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
            >
              <MessageCircle className="size-5" />
            </button>
            <button
              type="button"
              onClick={onOpenProject}
              aria-label="Configura tu participación"
              className="p-2 text-white/60 hover:text-sky transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
            >
              <Sparkles className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => onMenuToggle(!isMenuOpen)}
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isMenuOpen}
              className="p-2 text-white hover:text-sky transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
            >
              {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            aria-label="Menú principal"
            className="fixed inset-0 z-40 bg-abyss flex items-center"
          >
            <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
              <ul className="space-y-6">
                {CHAPTERS.map((chapter, i) => (
                  <li key={chapter.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onMenuToggle(false);
                        onNavigate(i);
                      }}
                      className="group flex items-baseline gap-4 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
                    >
                      <span className="font-mono text-xs text-ember">{chapter.index}</span>
                      <span className="font-display text-4xl md:text-6xl font-black tracking-tighter group-hover:text-sky transition-colors">
                        {chapter.title}
                      </span>
                    </button>
                  </li>
                ))}
                <li>
                  <a
                    href="#inscripcion"
                    onClick={() => onMenuToggle(false)}
                    className="group flex items-baseline gap-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
                  >
                    <span className="font-mono text-xs text-ember">06</span>
                    <span className="font-display text-4xl md:text-6xl font-black tracking-tighter text-ember group-hover:text-sky transition-colors">
                      {CABECERA.menuInscripcion}
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
