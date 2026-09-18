import { Compass } from "lucide-react";
import type { EstadoGiroscopio } from "../hooks/useGyroscope";

interface GyroToggleProps {
  estado: EstadoGiroscopio;
  onToggle: () => void;
}

/**
 * Interruptor del mando por inclinación. Sólo aparece donde el sensor existe;
 * si el visitante deniega el permiso, se queda visible pero explica por qué no
 * responde, que es más útil que desaparecer sin más.
 */
export default function GyroToggle({ estado, onToggle }: GyroToggleProps) {
  if (estado === "no-disponible") return null;

  const activo = estado === "activo";
  const denegado = estado === "denegado";
  const etiqueta = denegado
    ? "Permiso de movimiento denegado — actívalo en los ajustes del navegador"
    : activo
      ? "Dejar de mover el vídeo con la inclinación"
      : "Mover el vídeo inclinando el teléfono";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={denegado}
      aria-label={etiqueta}
      title={etiqueta}
      aria-pressed={activo}
      className={`fixed bottom-6 left-20 z-40 size-11 rounded-full bg-abyss/80 backdrop-blur-md border transition-colors
                  flex items-center justify-center
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-ink
                  disabled:opacity-40 disabled:cursor-not-allowed ${
                    activo
                      ? "border-ember/50 text-ember-ink"
                      : "border-ink/10 text-ink/70 hover:text-ember-ink hover:border-ember/40"
                  }`}
    >
      <Compass className={`size-4 ${activo ? "animate-pulse" : ""}`} />
    </button>
  );
}
