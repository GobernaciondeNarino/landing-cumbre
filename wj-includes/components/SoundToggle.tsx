import { Volume2, VolumeX } from "lucide-react";

interface SoundToggleProps {
  isSoundOn: boolean;
  onToggle: (on: boolean) => void;
}

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
