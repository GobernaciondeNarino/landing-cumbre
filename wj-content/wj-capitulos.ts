// ============================================================================
// CAPÍTULOS DEL RECORRIDO — cada objeto es una "pantalla" del scroll con vídeo.
// El orden de la lista es el orden del recorrido; el vídeo de secuencia se
// reparte en partes iguales entre los capítulos (5 capítulos = 5 tramos).
// ============================================================================

export const CHAPTERS = [
  {
    id: "manifiesto",
    index: "01",
    title: "Manifiesto",
    kicker: "Qué es la Cumbre",
    body: "La Cumbre IA Nariño reúne en Pasto a quienes están construyendo el futuro de la inteligencia artificial desde el suroccidente colombiano: gobierno, academia, empresa y comunidad en un mismo escenario.",
  },
  {
    id: "ejes",
    index: "02",
    title: "Ejes",
    kicker: "De qué hablaremos",
    body: "IA para el sector público, talento digital territorial, emprendimiento con datos y ética de los sistemas inteligentes. Cuatro ejes, una conversación: cómo la IA transforma la vida en el territorio.",
  },
  {
    id: "experiencias",
    index: "03",
    title: "Experiencias",
    kicker: "Qué vivirás",
    body: "Dos días de programación continua diseñada para pasar de la inspiración a la práctica.",
    services: [
      "Conferencias centrales con referentes nacionales e internacionales",
      "Talleres prácticos de herramientas de IA aplicada",
      "Muestra interactiva de proyectos del ecosistema nariñense",
    ],
  },
  {
    id: "comunidad",
    index: "04",
    title: "Comunidad",
    kicker: "Quiénes estaremos",
    body: "Estudiantes, servidores públicos, emprendedores y curiosos de toda la región. La Cumbre es el punto de encuentro del ecosistema de innovación de Nariño.",
    showAvatars: true,
    avataresNota: "asistentes esperados",
    avataresCifra: "500+",
  },
  {
    id: "programa",
    index: "05",
    title: "El programa",
    kicker: "Por qué inscribirte",
    body: "La entrada es libre con inscripción previa y los cupos son limitados. Asegura tu lugar y sé parte de la primera gran cita de la inteligencia artificial en Nariño.",
    showCta: true,
    ctaTexto: "Quiero inscribirme",
  },
] as const;

export type Chapter = (typeof CHAPTERS)[number];

/** Retratos de la fila de avatares del capítulo Comunidad. */
export const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80",
];
