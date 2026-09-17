import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SlidersHorizontal, X } from "lucide-react";

const SWATCHES = [
  { hex: "#FF6300", rgba: "rgba(255, 99, 0, 0.45)", label: "Ember" },
  { hex: "#009EDB", rgba: "rgba(0, 158, 219, 0.45)", label: "Sky" },
  { hex: "#FEB100", rgba: "rgba(254, 177, 0, 0.45)", label: "Amber" },
  { hex: "#8C0001", rgba: "rgba(140, 0, 1, 0.55)", label: "Crimson" },
];

interface AmbientGlowStudioProps {
  ambientGlowColor: string;
  glowSize: number;
  glowIntensity: number;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onIntensityChange: (intensity: number) => void;
}

export default function AmbientGlowStudio({
  ambientGlowColor,
  glowSize,
  glowIntensity,
  onColorChange,
  onSizeChange,
  onIntensityChange,
}: AmbientGlowStudioProps) {
  const [showGlowControls, setShowGlowControls] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {showGlowControls && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-14 right-0 w-64 rounded-2xl bg-abyss/90 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_-20px_#8c0001] p-5"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 mb-4">
              Ambient Glow Studio
            </p>

            <label className="block mb-4">
              <span className="flex justify-between font-mono text-[10px] text-white/60 mb-1">
                Tamaño <span className="text-amber">{glowSize}</span>
              </span>
              <input
                type="range"
                min={40}
                max={150}
                value={glowSize}
                onChange={(e) => onSizeChange(Number(e.target.value))}
                className="w-full accent-[#ff6300]"
              />
            </label>

            <label className="block mb-4">
              <span className="flex justify-between font-mono text-[10px] text-white/60 mb-1">
                Intensidad <span className="text-amber">{glowIntensity.toFixed(1)}</span>
              </span>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={glowIntensity}
                onChange={(e) => onIntensityChange(Number(e.target.value))}
                className="w-full accent-[#ff6300]"
              />
            </label>

            <div className="flex items-center gap-3">
              {SWATCHES.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  aria-label={`Glow ${swatch.label}`}
                  aria-pressed={ambientGlowColor === swatch.rgba}
                  onClick={() => onColorChange(swatch.rgba)}
                  className={`size-7 rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky ${
                    ambientGlowColor === swatch.rgba ? "ring-2 ring-white/60 ring-offset-2 ring-offset-abyss" : ""
                  }`}
                  style={{ background: swatch.hex }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setShowGlowControls((v) => !v)}
        aria-label={showGlowControls ? "Cerrar controles de glow" : "Abrir controles de glow"}
        aria-expanded={showGlowControls}
        className="size-11 rounded-full bg-abyss/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-ember hover:border-ember/40 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
      >
        {showGlowControls ? <X className="size-4" /> : <SlidersHorizontal className="size-4" />}
      </button>
    </div>
  );
}
