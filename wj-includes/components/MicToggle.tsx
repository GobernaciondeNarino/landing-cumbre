import { Mic } from "lucide-react";
import { VOZ } from "../../wj-content/wj-voz";

interface MicToggleProps {
  /** Hay una conversación de voz en curso. */
  activa: boolean;
  onOpen: () => void;
}

/**
 * Micrófono flotante: abre el asistente y pide conversación por voz.
 *
 * Ocupa el sitio que tenía el interruptor de sonido de la interfaz. Colgar se
 * hace desde el propio asistente, que es donde se ve el estado de la llamada;
 * un botón que a veces llama y a veces cuelga, según un estado que no se ve
 * desde aquí, se pulsa mal.
 */
export default function MicToggle({ activa, onOpen }: MicToggleProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={activa ? VOZ.estadoEscuchando : VOZ.botonHablar}
      title={activa ? VOZ.estadoEscuchando : VOZ.botonHablar}
      className={`fixed bottom-6 left-6 z-40 size-11 rounded-full bg-abyss/80 backdrop-blur-md border
                  flex items-center justify-center transition-colors
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-ink ${
                    activa
                      ? "border-ember/50 text-ember-ink"
                      : "border-ink/10 text-ink/70 hover:text-ember-ink hover:border-ember/40"
                  }`}
    >
      <Mic className={`size-4 ${activa ? "animate-pulse" : ""}`} />
      {activa && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-ember/40 animate-ping"
        />
      )}
    </button>
  );
}
