import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Mic, PhoneOff, Send, X } from "lucide-react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { VOZ } from "../../wj-content/wj-voz";
import { construirSesion, pedirMicrofono } from "../voz/sesion";

interface Mensaje {
  id: number;
  role: "user" | "assistant";
  text: string;
}

interface ChatDrawerProps {
  onClose: () => void;
  /** Abrir ya hablando: viene del botón del micrófono. */
  iniciarVoz?: boolean;
  /** Informa al resto de la página de si hay llamada en curso. */
  onVozChange?: (activa: boolean) => void;
}

/**
 * Asistente de la Cumbre: un solo hilo para lo escrito y lo hablado.
 *
 * Todo el SDK de ElevenLabs cuelga de este componente, que se carga aparte
 * (ver `App.tsx`): arrastra `livekit-client` y no tiene por qué pesar en la
 * primera carga de quien nunca abra el asistente.
 *
 * La sesión vive mientras el panel está abierto. Cerrarlo cuelga, que es lo
 * que espera cualquiera que cierre una ventana de llamada.
 */
export default function ChatDrawer({ onClose, iniciarVoz, onVozChange }: ChatDrawerProps) {
  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 260 }}
      role="dialog"
      aria-label="Asistente de la Cumbre"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-abyss border-l border-ink/10 shadow-[-24px_0_60px_-30px_rgba(11,13,18,0.45)] flex flex-col"
    >
      <ConversationProvider>
        <Contenido onClose={onClose} iniciarVoz={iniciarVoz} onVozChange={onVozChange} />
      </ConversationProvider>
    </motion.aside>
  );
}

function Contenido({ onClose, iniciarVoz = false, onVozChange }: ChatDrawerProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { id: 0, role: "assistant", text: VOZ.saludo },
  ]);
  const [borrador, setBorrador] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [arrancando, setArrancando] = useState(false);
  // Si el asistente de voz está listo sólo se sabe preguntándole al servidor,
  // y eso no se hace hasta que alguien pulsa el micrófono: abrir el panel para
  // escribir no tiene por qué saludar con un aviso de algo que no ha fallado.
  const [aviso, setAviso] = useState<string | null>(null);

  const listaRef = useRef<HTMLDivElement | null>(null);
  const siguienteId = useRef(1);

  const anadir = useCallback((role: Mensaje["role"], text: string) => {
    const limpio = text.trim();
    if (!limpio) return;
    setMensajes((previos) => {
      // El texto que enviamos a mano vuelve también por `onMessage`; sin esto
      // cada frase se leería dos veces en el hilo.
      const ultimo = previos[previos.length - 1];
      if (ultimo && ultimo.role === role && ultimo.text === limpio) return previos;
      return [...previos, { id: siguienteId.current++, role, text: limpio }];
    });
  }, []);

  const conversacion = useConversation({
    onMessage: ({ message, role }) => anadir(role === "user" ? "user" : "assistant", message),
    onConnect: () => {
      setAviso(null);
      onVozChange?.(true);
    },
    onDisconnect: () => onVozChange?.(false),
    onError: (mensaje: unknown) => {
      // El SDK describe el fallo en inglés y en sus propios términos («Failed
      // to fetch conversation token…»). Eso sirve para depurar, no para un
      // visitante: al panel va el aviso en castellano y el detalle a la consola.
      if (import.meta.env.DEV) console.warn("[voz] ", mensaje);
      setAviso(VOZ.estadoError);
      onVozChange?.(false);
    },
  });

  const conectado = conversacion.status === "connected";
  const conectando = conversacion.status === "connecting" || arrancando;

  const iniciarLlamada = useCallback(async () => {
    setArrancando(true);
    setAviso(null);
    try {
      if (!(await pedirMicrofono())) {
        setAviso(VOZ.sinMicrofono);
        return;
      }
      const sesion = await construirSesion();
      if (!sesion) {
        setAviso(VOZ.sinConfigurar);
        return;
      }
      conversacion.startSession(sesion);
    } catch (error) {
      setAviso(error instanceof Error ? error.message : VOZ.estadoError);
    } finally {
      setArrancando(false);
    }
    // `conversacion` cambia de identidad en cada render, pero sus acciones son
    // estables por contrato del SDK; dependerlo aquí recrearía la función sin
    // necesidad en cada mensaje que entra.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El botón del micrófono abre el panel pidiendo llamada: se atiende una vez.
  const yaPedida = useRef(false);
  useEffect(() => {
    if (iniciarVoz && !yaPedida.current) {
      yaPedida.current = true;
      void iniciarLlamada();
    }
  }, [iniciarVoz, iniciarLlamada]);

  // Cerrar el panel cuelga. `endSession` es estable; se guarda para que el
  // desmontaje no dependa del último render.
  const colgarRef = useRef(conversacion.endSession);
  colgarRef.current = conversacion.endSession;
  useEffect(
    () => () => {
      try {
        colgarRef.current();
      } catch {
        // Ya estaba colgado: no hay nada que deshacer.
      }
      onVozChange?.(false);
    },
    [onVozChange],
  );

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [onClose]);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
  }, [mensajes]);

  const enviar = async () => {
    const texto = borrador.trim();
    if (!texto || enviando) return;
    setBorrador("");
    anadir("user", texto);
    if (conectado) {
      // Con la llamada abierta, el agente contesta por audio y su texto entra
      // por `onMessage`: el hilo escrito y el hablado son el mismo.
      conversacion.sendUserMessage(texto);
      return;
    }
    setEnviando(true);
    await new Promise((listo) => setTimeout(listo, 300));
    anadir("assistant", VOZ.respuestaLocal);
    setEnviando(false);
  };

  const estado = conectado
    ? conversacion.isSpeaking
      ? VOZ.estadoHablando
      : VOZ.estadoEscuchando
    : conectando
      ? VOZ.estadoConectando
      : null;

  return (
    <>
      <header className="flex items-center justify-between px-6 h-16 border-b border-ink/10">
        <div>
          <p className="font-display font-black tracking-tighter leading-none">
            Asistente <span className="text-ember-ink">·</span> Cumbre IA
          </p>
          {estado && (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sky-ink mt-1">
              <span
                aria-hidden="true"
                className={`inline-block size-1.5 rounded-full mr-1.5 align-middle ${
                  conectado ? "bg-ember animate-pulse" : "bg-sky"
                }`}
              />
              {estado}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar asistente"
          className="p-2 text-ink/60 hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-ink"
        >
          <X className="size-5" />
        </button>
      </header>

      <div ref={listaRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {mensajes.map((mensaje) => (
          <div
            key={mensaje.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              mensaje.role === "user" ? "ml-auto bg-sky/15 text-ink" : "bg-ink/5 text-ink/70"
            }`}
          >
            {mensaje.text}
          </div>
        ))}
      </div>

      {aviso && (
        <p
          role="status"
          className="mx-4 mb-2 rounded-xl bg-amber/15 border border-amber/40 px-3 py-2 text-xs text-ink/70"
        >
          {aviso}
        </p>
      )}

      <div className="border-t border-ink/10 p-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => (conectado ? conversacion.endSession() : void iniciarLlamada())}
          disabled={conectando}
          aria-label={conectado ? VOZ.botonColgar : VOZ.botonHablar}
          title={conectado ? VOZ.botonColgar : VOZ.botonHablar}
          className={`size-10 shrink-0 rounded-full border flex items-center justify-center transition-colors
                      disabled:opacity-40 disabled:pointer-events-none
                      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-ink ${
                        conectado
                          ? "bg-crimson border-crimson text-on-dark"
                          : "border-ink/15 text-ink/70 hover:text-ember-ink hover:border-ember/40"
                      }`}
        >
          {conectado ? <PhoneOff className="size-4" /> : <Mic className="size-4" />}
        </button>

        <input
          type="text"
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void enviar();
          }}
          placeholder={conectado ? "Habla o escribe…" : "Escribe tu pregunta…"}
          aria-label="Mensaje para el asistente"
          className="flex-1 min-w-0 rounded-full bg-abyss-deep border border-ink/10 px-4 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:outline-2 focus:outline-offset-2 focus:outline-sky-ink"
        />
        <button
          type="button"
          onClick={() => void enviar()}
          disabled={enviando || borrador.trim() === ""}
          aria-label="Enviar mensaje"
          className="size-10 shrink-0 rounded-full bg-ember text-on-accent flex items-center justify-center transition-colors hover:bg-crimson hover:text-on-dark disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-ink"
        >
          <Send className="size-4" />
        </button>
      </div>
    </>
  );
}
