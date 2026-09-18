import { Volume2, VolumeX } from "lucide-react";

interface SoundToggleProps {
  isSoundOn: boolean;
  onToggle: (on: boolean) => void;
}

/**
 * Sonidos de la interfaz: los clics cortos de la navegación y los capítulos.
 *
 * Es un control distinto del micrófono, que está justo al lado: éste decide si
 * la página suena, el otro abre una conversación con el asistente. Se mantienen
 * separados porque hacen cosas distintas y se activan en momentos distintos.
 */
export default function SoundToggle({ isSoundOn, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!isSoundOn)}
      aria-label={isSoundOn ? "Silenciar interfaz" : "Activar sonido de interfaz"}
      aria-pressed={isSoundOn}
      className="fixed bottom-6 left-6 z-40 size-11 rounded-full bg-abyss/80 backdrop-blur-md border border-ink/10 flex items-center justify-center text-ink/70 hover:text-ember-ink hover:border-ember/40 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-ink"
    >
      {isSoundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
    </button>
  );
}
