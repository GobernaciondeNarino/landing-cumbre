import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

const STEPS = ["Perfil", "Interés", "Contacto"] as const;

const PROFILES = ["Estudiante", "Servidor público", "Emprendedor/a", "Docente o investigador/a"];
const INTERESTS = [
  "IA para el sector público",
  "Talento digital territorial",
  "Emprendimiento con datos",
  "Ética de la IA",
];

interface ProjectModalProps {
  onClose: () => void;
}

export default function ProjectModal({ onClose }: ProjectModalProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState("");
  const [interest, setInterest] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Cierre con Escape y foco atrapado dentro del panel.
  useEffect(() => {
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("button, input")?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'button, input, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const canContinue =
    (step === 0 && profile !== "") ||
    (step === 1 && interest !== "") ||
    (step === 2 && name.trim() !== "");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink/40 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Configura tu participación"
    >
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-abyss border border-ink/10 p-8 shadow-[0_32px_80px_-32px_rgba(11,13,18,0.45)]"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40 mb-1">
              Cumbre IA Nariño
            </p>
            <h2 className="font-display text-2xl font-black tracking-tighter">
              Configura tu participación
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 text-ink/60 hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-ink"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Barra de progreso de pasos */}
        <div className="flex items-center gap-2 mb-8" aria-hidden="true">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1 rounded-full transition-colors ${
                  i <= step ? "bg-sky" : "bg-ink/10"
                }`}
              />
              <p
                className={`mt-2 font-mono text-[10px] uppercase tracking-widest ${
                  i <= step ? "text-sky-ink" : "text-ink/30"
                }`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {done ? (
          <div className="text-center py-6">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-sky/15 text-sky-ink mb-4">
              <Check className="size-6" />
            </span>
            <p className="text-ink/70 mb-2">
              Gracias, <span className="text-ink">{name.trim()}</span>. Tu perfil de{" "}
              <span className="text-amber-ink">{profile}</span> con interés en{" "}
              <span className="text-amber-ink">{interest}</span> quedó registrado en este navegador.
            </p>
            <p className="text-ink/40 text-sm">
              Completa la inscripción oficial desde la sección Inscripción.
            </p>
          </div>
        ) : (
          <>
            {step === 0 && (
              <OptionList options={PROFILES} selected={profile} onSelect={setProfile} />
            )}
            {step === 1 && (
              <OptionList options={INTERESTS} selected={interest} onSelect={setInterest} />
            )}
            {step === 2 && (
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/40">
                  ¿Cómo te llamas?
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="mt-2 w-full rounded-xl bg-abyss-deep border border-ink/10 px-4 py-3 text-ink placeholder:text-ink/30 focus:outline-2 focus:outline-offset-2 focus:outline-sky-ink"
                />
              </label>
            )}

            <div className="flex items-center justify-between mt-8">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink/50 hover:text-ink transition-colors disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-ink"
              >
                <ArrowLeft className="size-4" /> Atrás
              </button>
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => (step === 2 ? setDone(true) : setStep((s) => s + 1))}
                className="inline-flex items-center gap-2 rounded-full bg-ember px-6 py-2.5 font-display text-sm font-bold text-on-accent transition-colors hover:bg-crimson hover:text-on-dark disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-ink"
              >
                {step === 2 ? "Finalizar" : "Continuar"} <ArrowRight className="size-4" />
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function OptionList({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={selected === option}
          onClick={() => onSelect(option)}
          className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-ink ${
            selected === option
              ? "border-sky bg-sky/10 text-ink"
              : "border-ink/10 text-ink/60 hover:border-ink/25 hover:text-ink"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
