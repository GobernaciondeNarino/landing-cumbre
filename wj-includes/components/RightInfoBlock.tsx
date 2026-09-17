import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { HERO } from "../../wj-content/wj-textos";

export default function RightInfoBlock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
      className="lg:col-span-6 xl:col-span-5 flex justify-end"
    >
      <div className="text-right">
        <p className="font-mono text-xs text-white/40 uppercase tracking-[0.25em] mb-2">
          {HERO.notaDerecha} · <span className="text-amber">{HERO.notaDerechaDestacada}</span>
        </p>
        <div className="flex items-center justify-end gap-2 text-white/60">
          <span className="font-mono text-xs uppercase tracking-[0.25em]">
            {HERO.indicadorScroll}
          </span>
          <motion.span
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <ChevronDown className="size-4 text-ember" />
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
