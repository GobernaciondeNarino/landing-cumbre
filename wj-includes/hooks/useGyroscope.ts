import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Inclinación del dispositivo como mando del banner.
 *
 * En móvil no hay cursor con el que recorrer el clip del personaje, así que el
 * giroscopio hace de sustituto: girar el teléfono sobre su eje vertical mueve
 * el vídeo igual que el ratón en escritorio.
 *
 * Tres detalles que hacen que esto funcione de verdad en la calle:
 *
 *  · iOS 13 y posteriores exigen pedir permiso con `requestPermission()` y sólo
 *    lo conceden si la llamada sale de un gesto del usuario. De ahí que esto
 *    sea una opción con botón y no algo que se active solo.
 *  · La primera lectura fija el cero. Nadie sostiene el teléfono perfectamente
 *    plano, y sin calibrar, el vídeo arrancaría pegado a un extremo.
 *  · Android sólo emite `deviceorientation` bajo HTTPS. Si en segundo y medio
 *    no ha llegado ninguna lectura, se da por no disponible y el botón
 *    desaparece en lugar de quedarse encendido sin hacer nada.
 */

export type EstadoGiroscopio = "no-disponible" | "inactivo" | "activo" | "denegado";

/** El `requestPermission` de iOS no está en la lib DOM de TypeScript. */
interface ConstructorOrientacion {
  requestPermission?: () => Promise<PermissionState | "granted" | "denied">;
}

/** Grados de giro que recorren el clip de principio a fin. */
const RANGO_GRADOS = 30;

export function useGyroscope(onTilt: (tilt: number) => void) {
  const [soportado] = useState(detectarSoporte);
  const [estado, setEstado] = useState<EstadoGiroscopio>(
    soportado ? "inactivo" : "no-disponible",
  );

  // El consumidor puede recrear la función en cada render; la lectura del
  // sensor llega decenas de veces por segundo y no debe reenganchar nada.
  const onTiltRef = useRef(onTilt);
  useEffect(() => {
    onTiltRef.current = onTilt;
  }, [onTilt]);

  const activar = useCallback(async () => {
    if (!soportado) return;
    const ctor = window.DeviceOrientationEvent as unknown as ConstructorOrientacion;
    if (typeof ctor?.requestPermission === "function") {
      try {
        const respuesta = await ctor.requestPermission();
        if (respuesta !== "granted") {
          setEstado("denegado");
          return;
        }
      } catch {
        setEstado("denegado");
        return;
      }
    }
    setEstado("activo");
  }, [soportado]);

  const desactivar = useCallback(() => {
    setEstado((previo) => (previo === "activo" ? "inactivo" : previo));
  }, []);

  useEffect(() => {
    if (estado !== "activo") return;

    let origen: number | null = null;
    let recibido = false;

    const alInclinar = (evento: DeviceOrientationEvent) => {
      const gamma = evento.gamma;
      if (gamma === null || gamma === undefined || !Number.isFinite(gamma)) return;
      recibido = true;
      if (origen === null) origen = gamma;
      const delta = (gamma - origen) / RANGO_GRADOS;
      onTiltRef.current(Math.max(-1, Math.min(1, delta)));
    };

    window.addEventListener("deviceorientation", alInclinar, true);
    const testigo = window.setTimeout(() => {
      if (!recibido) setEstado("no-disponible");
    }, 1500);

    return () => {
      window.removeEventListener("deviceorientation", alInclinar, true);
      window.clearTimeout(testigo);
    };
  }, [estado]);

  return { estado, activo: estado === "activo", soportado, activar, desactivar };
}

function detectarSoporte(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.DeviceOrientationEvent === "undefined") return false;
  // Sin puntero fino: es un móvil o una tableta, que es donde esto tiene sentido.
  return window.matchMedia("(pointer: coarse)").matches;
}
