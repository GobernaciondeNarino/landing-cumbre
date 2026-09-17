import { useCallback, useRef } from "react";

/**
 * Sintetizador Web Audio mínimo: un click corto por oscilador con rampa de
 * ganancia de ~0.03 s. El AudioContext se crea en el primer gesto del usuario,
 * nunca antes, y nada suena mientras `enabledRef` esté apagado.
 */
export function useAudioClick() {
  const contextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(false);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
    if (enabled && !contextRef.current) {
      contextRef.current = new AudioContext();
    }
    if (enabled && contextRef.current?.state === "suspended") {
      void contextRef.current.resume();
    }
  }, []);

  const playClick = useCallback((frequency = 880) => {
    if (!enabledRef.current) return;
    const context = contextRef.current;
    if (!context || context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }, []);

  return { setEnabled, playClick };
}
