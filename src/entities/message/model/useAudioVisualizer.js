import { useCallback, useEffect, useRef, useState } from "react";

const MIN_BAR_HEIGHT = 2;
const MAX_BAR_HEIGHT = 25;

function createRandomBars(count) {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) + MIN_BAR_HEIGHT)
  );
}

function buildBarsFromFrequencies(frequencies, barCount) {
  const bars = [];
  const step = Math.floor(frequencies.length / barCount) || 1;

  for (let i = 0; i < barCount; i += 1) {
    const startIndex = i * step;
    let sum = 0;

    for (let j = 0; j < step && startIndex + j < frequencies.length; j += 1) {
      sum += frequencies[startIndex + j];
    }

    const average = sum / step;
    const height =
      MIN_BAR_HEIGHT + (average / 255) * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT);
    bars.push(Math.floor(height));
  }

  return bars;
}

export function useAudioVisualizer({ barCount = 40 }) {
  const [bars, setBars] = useState(() => createRandomBars(barCount));

  const audioContextRef = useRef();
  const analyzerRef = useRef();
  const sourceNodeRef = useRef();
  const animationFrameRef = useRef();
  const animationLoopRef = useRef();

  const stopVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, []);

  const renderFrame = useCallback(() => {
    if (!analyzerRef.current) {
      return;
    }

    const frequencies = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(frequencies);
    setBars(buildBarsFromFrequencies(frequencies, barCount));
  }, [barCount]);

  useEffect(() => {
    animationLoopRef.current = () => {
      renderFrame();
      animationFrameRef.current = requestAnimationFrame(animationLoopRef.current);
    };
  }, [renderFrame]);

  const setupContext = useCallback((audioElement) => {
    if (!audioElement) {
      return false;
    }

    if (!audioContextRef.current) {
      try {
        const ContextConstructor = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new ContextConstructor();
      } catch (error) {
        console.error("Audio ctx create error", error);
        return false;
      }
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {});
    }

    if (!analyzerRef.current) {
      try {
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 128;
      } catch (error) {
        console.error("Audio analyzer setup error", error);
        return false;
      }
    }

    if (!sourceNodeRef.current) {
      try {
        sourceNodeRef.current =
          audioContextRef.current.createMediaElementSource(audioElement);
        sourceNodeRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(audioContextRef.current.destination);
      } catch (error) {
        console.error("Audio ctx wiring error", error);
        return false;
      }
    }

    return true;
  }, []);

  const startVisualization = useCallback(
    (audioElement) => {
      const isReady = setupContext(audioElement);
      if (!isReady) {
        return false;
      }

      animationLoopRef.current?.();
      return true;
    },
    [setupContext]
  );

  useEffect(
    () => () => {
      stopVisualization();

      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close().catch(() => {});
      }

      sourceNodeRef.current = undefined;
      analyzerRef.current = undefined;
      audioContextRef.current = undefined;
      animationLoopRef.current = undefined;
    },
    [stopVisualization]
  );

  return {
    bars,
    startVisualization,
    stopVisualization,
  };
}

export default useAudioVisualizer;
