import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { FORM_URL } from "../../wj-content/wj-enlaces";
import { INSCRIPCION } from "../../wj-content/wj-textos";

interface InscriptionSectionProps {
  onHoverCta: () => void;
}

export default function InscriptionSection({ onHoverCta }: InscriptionSectionProps) {
  const hasForm = FORM_URL.trim().length > 0;

  return (
    <section
      id="inscripcion"
      aria-label="Inscripción"
      className="relative min-h-screen flex items-center border-t border-white/10 py-24 bg-abyss overflow-hidden"
    >
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[480px] rounded-full blur-[120px] opacity-30 pointer-events-none"
        style={{ background: "#FF6300" }}
      />

      <div className="relative max-w-4xl mx-auto px-6 md:px-12 text-center">
        <p className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.3em] text-ember uppercase mb-6">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-ember animate-pulse" />
          {INSCRIPCION.etiqueta}
        </p>
        <h2 className="font-display text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter mb-8">
          {INSCRIPCION.titulo}
        </h2>
        <p className="text-white/50 max-w-xl mx-auto mb-8">{INSCRIPCION.parrafo}</p>

        <p className="font-mono text-xs mb-10">
          <span className="text-amber">{INSCRIPCION.datoCupos}</span>
          <span className="text-white/40">{INSCRIPCION.datoCuposEtiqueta}</span>
          <span className="text-white/40"> · </span>
          <span className="text-amber">{INSCRIPCION.datoModalidad}</span>
          <span className="text-white/40">{INSCRIPCION.datoModalidadEtiqueta}</span>
          <span className="text-amber">{INSCRIPCION.datoFecha}</span>
          <span className="text-white/40">{INSCRIPCION.datoFechaEtiqueta}</span>
        </p>

        {hasForm ? (
          <motion.a
            href={FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={onHoverCta}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group inline-flex items-center gap-3 rounded-full bg-ember px-8 py-4
                       font-display text-base font-bold text-abyss
                       transition-colors hover:bg-crimson hover:text-white
                       focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
          >
            {INSCRIPCION.botonTexto}
            <ArrowUpRight className="size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </motion.a>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-3 rounded-full bg-ember px-8 py-4
                       font-display text-base font-bold text-abyss pointer-events-none opacity-40"
          >
            {INSCRIPCION.botonTexto}
            <ArrowUpRight className="size-5" />
          </span>
        )}

        <p className="text-white/30 text-xs mt-4">
          {hasForm ? INSCRIPCION.notaConFormulario : INSCRIPCION.notaSinFormulario}
        </p>
      </div>
    </section>
  );
}
