import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAudioVisualizer } from "./useAudioVisualizer";

function toSafeDuration(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function useAudioMessage({ duration, barCount = 40 }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [knownDuration, setKnownDuration] = useState(() =>
    toSafeDuration(duration)
  );

  const audioRef = useRef();
  const intervalRef = useRef();

  const { bars, startVisualization, stopVisualization } = useAudioVisualizer({
    barCount,
  });

  const effectiveDuration =
    toSafeDuration(duration) || toSafeDuration(knownDuration);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      return undefined;
    }

    const handleEnded = () => {
      setIsPlaying(false);
      stopVisualization();
    };

    const handleLoadedMetadata = () => {
      const metadataDuration = toSafeDuration(audioElement.duration);
      if (metadataDuration > 0 && !toSafeDuration(duration)) {
        setKnownDuration(metadataDuration);
      }
    };

    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }

      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.pause();
      stopVisualization();
    };
  }, [duration, stopVisualization]);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }

      return undefined;
    }

    intervalRef.current = setInterval(() => {
      const audioElement = audioRef.current;
      if (!audioElement) {
        return;
      }

      const playbackDuration =
        toSafeDuration(duration) ||
        toSafeDuration(audioElement.duration) ||
        toSafeDuration(knownDuration);
      const nextCurrentTime = audioElement.currentTime;

      setCurrentTime(nextCurrentTime);

      if (playbackDuration > 0) {
        setProgress(Math.min(100, (nextCurrentTime / playbackDuration) * 100));

        if (!toSafeDuration(duration)) {
          setKnownDuration((prev) => toSafeDuration(prev) || playbackDuration);
        }
      } else {
        setProgress(0);
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [duration, isPlaying, knownDuration]);

  const handlePlayPause = useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      return;
    }

    if (isPlaying) {
      audioElement.pause();
      stopVisualization();
      setIsPlaying(false);
      return;
    }

    audioElement
      .play()
      .then(() => {
        startVisualization(audioElement);
        setIsPlaying(true);
      })
      .catch((error) => {
        console.error("play error", error);
      });
  }, [isPlaying, startVisualization, stopVisualization]);

  const handleSeek = useCallback(
    (event) => {
      const audioElement = audioRef.current;
      if (!audioElement) {
        return;
      }

      const nextProgress = parseFloat(event.target.value);
      const playbackDuration =
        toSafeDuration(duration) ||
        toSafeDuration(audioElement.duration) ||
        toSafeDuration(knownDuration);

      if (!playbackDuration) {
        return;
      }

      const nextCurrentTime = (nextProgress * playbackDuration) / 100;
      if (Number.isFinite(nextCurrentTime) && nextCurrentTime >= 0) {
        audioElement.currentTime = nextCurrentTime;
        setCurrentTime(nextCurrentTime);
        setProgress(nextProgress);
      }
    },
    [duration, knownDuration]
  );

  const formatTime = useCallback((time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const durationLabel = useMemo(
    () => formatTime(toSafeDuration(effectiveDuration)),
    [effectiveDuration, formatTime]
  );

  return {
    audioRef,
    isPlaying,
    currentTime,
    progress,
    bars,
    durationLabel,
    handlePlayPause,
    handleSeek,
    formatTime,
  };
}

export default useAudioMessage;
