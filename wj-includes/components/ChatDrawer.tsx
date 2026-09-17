import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Send, X } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
}

/**
 * Punto único de integración con un modelo. Hoy responde en local; para
 * conectar un backend real, sustituye el cuerpo de esta función.
 */
async function sendMessage(text: string): Promise<string> {
  void text;
  return "Gracias por escribir. Muy pronto este asistente responderá con la programación completa de la Cumbre. Mientras tanto, revisa los capítulos de la página y la sección de inscripción.";
}

interface ChatDrawerProps {
  onClose: () => void;
}

export default function ChatDrawer({ onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      text: "¡Hola! Soy el asistente de la Cumbre IA Nariño. ¿En qué te puedo ayudar?",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const nextIdRef = useRef(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    setSending(true);
    setMessages((prev) => [...prev, { id: nextIdRef.current++, role: "user", text }]);
    const reply = await sendMessage(text);
    setMessages((prev) => [...prev, { id: nextIdRef.current++, role: "assistant", text: reply }]);
    setSending(false);
  };

  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 260 }}
      role="dialog"
      aria-label="Asistente de la Cumbre"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-abyss border-l border-white/10 flex flex-col"
    >
      <header className="flex items-center justify-between px-6 h-16 border-b border-white/10">
        <p className="font-display font-black tracking-tighter">
          Asistente <span className="text-ember">·</span> Cumbre IA
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar asistente"
          className="p-2 text-white/60 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
        >
          <X className="size-5" />
        </button>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              message.role === "user"
                ? "ml-auto bg-sky/15 text-white"
                : "bg-white/5 text-white/70"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 p-4 flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSend();
          }}
          placeholder="Escribe tu pregunta…"
          aria-label="Mensaje para el asistente"
          className="flex-1 rounded-full bg-abyss-deep border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-2 focus:outline-offset-2 focus:outline-sky"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={sending || draft.trim() === ""}
          aria-label="Enviar mensaje"
          className="size-10 rounded-full bg-ember text-abyss flex items-center justify-center transition-colors hover:bg-crimson hover:text-white disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
        >
          <Send className="size-4" />
        </button>
      </div>
    </motion.aside>
  );
}
