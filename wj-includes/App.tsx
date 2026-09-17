import { useCallback, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import Header from "./components/Header";
import HeroStage from "./components/HeroStage";
import SequenceStage from "./components/SequenceStage";
import InscriptionSection from "./components/InscriptionSection";
import Footer from "./components/Footer";
import AmbientGlowStudio from "./components/AmbientGlowStudio";
import SoundToggle from "./components/SoundToggle";
import ScrollProgressRail from "./components/ScrollProgressRail";
import ProjectModal from "./components/ProjectModal";
import ChatDrawer from "./components/ChatDrawer";
import { useAudioClick } from "./hooks/useAudioClick";
import { CHAPTERS } from "../wj-content/wj-capitulos";

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
    <div className="relative bg-abyss text-white font-sans selection:bg-ember selection:text-abyss">
      <Header
        activeSection={activeSection}
        isMenuOpen={isMenuOpen}
        onMenuToggle={setIsMenuOpen}
        onNavigate={scrollToChapter}
        onOpenProject={() => setIsProjectOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
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

      <AnimatePresence>
        {isProjectOpen && <ProjectModal key="project" onClose={() => setIsProjectOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {isChatOpen && <ChatDrawer key="chat" onClose={() => setIsChatOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
