import { motion, type Variants } from "motion/react";
import { HERO } from "../../wj-content/wj-textos";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 18, stiffness: 100 },
  },
};

export default function HeroTitle() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full max-w-7xl mx-auto px-6 md:px-12 select-none"
    >
      <motion.p
        variants={itemVariants}
        className="text-xs font-mono tracking-[0.25em] text-amber uppercase mb-2"
      >
        {HERO.notaSuperior}
      </motion.p>
      <h1 className="font-display font-black leading-[0.85] tracking-tighter">
        {HERO.tituloLineas.map((linea) => (
          <motion.span
            key={linea}
            variants={itemVariants}
            className="block text-[13vw] md:text-[9.5vw] text-white"
          >
            {linea}
          </motion.span>
        ))}
        <motion.span
          variants={itemVariants}
          className="block text-[13vw] md:text-[9.5vw] bg-gradient-to-r from-amber to-ember bg-clip-text text-transparent pb-2"
        >
          {HERO.tituloAcento}
        </motion.span>
      </h1>
    </motion.div>
  );
}
