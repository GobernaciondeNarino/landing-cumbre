import { Suspense, lazy, useCallback, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import Header from "./components/Header";
import HeroStage from "./components/HeroStage";
import SequenceStage from "./components/SequenceStage";
import InscriptionSection from "./components/InscriptionSection";
import Footer from "./components/Footer";
import AmbientGlowStudio from "./components/AmbientGlowStudio";
import MicToggle from "./components/MicToggle";
import SoundToggle from "./components/SoundToggle";
import ScrollProgressRail from "./components/ScrollProgressRail";
import ProjectModal from "./components/ProjectModal";
import { useAudioClick } from "./hooks/useAudioClick";
import { CHAPTERS } from "../wj-content/wj-capitulos";

// El asistente arrastra el SDK de voz de ElevenLabs y, con él, livekit-client.
// Se carga la primera vez que alguien lo abre, no en cada visita.
const ChatDrawer = lazy(() => import("./components/ChatDrawer"));

export default function App() {
  return <Page />;
}

function Page() {
  const [ambientGlowColor, setAmbientGlowColor] = useState("rgba(255, 99, 0, 0.45)");
  const [glowSize, setGlowSize] = useState(80);
  const [glowIntensity, setGlowIntensity] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [vozPedida, setVozPedida] = useState(false);
  const [vozActiva, setVozActiva] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const sequenceRef = useRef<HTMLElement | null>(null);
  const { setEnabled, playClick } = useAudioClick();

  const handleSoundToggle = useCallback(
    (on: boolean) => {
      setIsSoundOn(on);
      setEnabled(on);
      if (on) playClick(660);
    },
    [setEnabled, playClick],
  );

  const abrirAsistente = useCallback(
    (conVoz: boolean) => {
      setVozPedida(conVoz);
      setIsChatOpen(true);
      playClick(660);
    },
    [playClick],
  );

  const cerrarAsistente = useCallback(() => {
    setIsChatOpen(false);
    setVozPedida(false);
    setVozActiva(false);
  }, []);

  const handleChapterChange = useCallback(
    (index: number) => {
      setActiveSection(index);
      playClick(880);
    },
    [playClick],
  );

  const scrollToChapter = useCallback((index: number) => {
    const sequence = sequenceRef.current;
    if (!sequence) return;
    const top = sequence.offsetTop;
    const travel = sequence.offsetHeight - window.innerHeight;
    const chapterCenter = (index + 0.5) / CHAPTERS.length;
    window.scrollTo({ top: top + travel * chapterCenter, behavior: "smooth" });
  }, []);

  return (
    <div className="relative bg-abyss text-ink font-sans selection:bg-ember selection:text-on-accent">
      <Header
        activeSection={activeSection}
        isMenuOpen={isMenuOpen}
        onMenuToggle={setIsMenuOpen}
        onNavigate={scrollToChapter}
        onOpenProject={() => setIsProjectOpen(true)}
        onOpenChat={() => abrirAsistente(false)}
      />

      <HeroStage
        ambientGlowColor={ambientGlowColor}
        glowSize={glowSize}
        glowIntensity={glowIntensity}
      />

      <SequenceStage
        ref={sequenceRef}
        ambientGlowColor={ambientGlowColor}
        glowSize={glowSize}
        glowIntensity={glowIntensity}
        onChapterChange={handleChapterChange}
        onHoverCta={() => playClick(1100)}
      />

      <InscriptionSection onHoverCta={() => playClick(1100)} />
      <Footer />

      <ScrollProgressRail activeSection={activeSection} onNavigate={scrollToChapter} />
      <AmbientGlowStudio
        ambientGlowColor={ambientGlowColor}
        glowSize={glowSize}
        glowIntensity={glowIntensity}
        onColorChange={setAmbientGlowColor}
        onSizeChange={setGlowSize}
        onIntensityChange={setGlowIntensity}
      />
      <SoundToggle isSoundOn={isSoundOn} onToggle={handleSoundToggle} />
      <MicToggle activa={vozActiva} onOpen={() => abrirAsistente(true)} />

      <AnimatePresence>
        {isProjectOpen && <ProjectModal key="project" onClose={() => setIsProjectOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {isChatOpen && (
          <Suspense fallback={null}>
            <ChatDrawer
              key="chat"
              onClose={cerrarAsistente}
              iniciarVoz={vozPedida}
              onVozChange={setVozActiva}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}
