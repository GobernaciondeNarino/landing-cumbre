import { useCallback, useRef, useState } from "react";

/**
 * Scrub compartido para los dos escenarios de vídeo: seek directo cuando el
 * vídeo está libre y cola de exactamente un seek pendiente mientras decodifica,
 * drenada en cada `seeked`. Evita la inundación de seeks cuando el puntero o el
 * scroll van más rápido que el decodificador.
 */
export function useVideoScrub(fallbackDuration: number) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const nextTargetTimeRef = useRef<number | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);

  const captureDuration = useCallback(() => {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration)) {
      setVideoDuration(video.duration);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    captureDuration();
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  }, [captureDuration]);

  const handleSeeked = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (nextTargetTimeRef.current !== null) {
      const target = nextTargetTimeRef.current;
      nextTargetTimeRef.current = null;
      video.currentTime = target;
    }
  }, []);

  const seekToProgress = useCallback(
    (progress: number) => {
      const video = videoRef.current;
      if (!video) return;
      let duration = videoDuration || video.duration;
      if (!duration || !Number.isFinite(duration)) duration = fallbackDuration;
      const clampedProgress = Math.max(0, Math.min(1, progress));
      // El -0.05 evita el bloqueo nativo del navegador en el frame final exacto.
      const maxSeekableTime = Math.max(0, duration - 0.05);
      const targetTime = clampedProgress * maxSeekableTime;
      if (video.seeking) {
        nextTargetTimeRef.current = targetTime;
      } else {
        video.currentTime = targetTime;
      }
    },
    [videoDuration, fallbackDuration],
  );

  return {
    videoRef,
    videoDuration,
    seekToProgress,
    videoHandlers: {
      onLoadedMetadata: handleLoadedMetadata,
      onDurationChange: captureDuration,
      onCanPlay: captureDuration,
      onSeeked: handleSeeked,
    },
  };
}
