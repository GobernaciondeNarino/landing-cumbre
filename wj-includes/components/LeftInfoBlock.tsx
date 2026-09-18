import { motion } from "motion/react";
import { HERO } from "../../wj-content/wj-textos";

export default function LeftInfoBlock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
      className="w-full lg:text-right"
    >
      <p className="font-mono text-xs tracking-[0.3em] text-ember-ink uppercase mb-3">
        {HERO.etiqueta}
      </p>
      <p className="text-ink/70 text-base md:text-lg leading-relaxed max-w-md lg:ml-auto">
        {HERO.parrafo}
      </p>
    </motion.div>
  );
}
