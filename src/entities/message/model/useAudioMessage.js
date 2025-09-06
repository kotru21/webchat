import { useState, useRef, useEffect, useCallback } from "react";

// Хук управления воспроизведением аудио и визуализацией.
export function useAudioMessage({ duration, barCount = 40 }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [bars, setBars] = useState([]);

  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const analyzerRef = useRef(null);
  const audioContextRef = useRef(null);
  const hasActivatedRef = useRef(false);
  const animationRef = useRef(null);

  const MIN_HEIGHT = 2;
  const MAX_HEIGHT = 25;

  useEffect(() => {
    setBars(
      Array.from({ length: barCount }, () =>
        Math.floor(Math.random() * (MAX_HEIGHT - MIN_HEIGHT) + MIN_HEIGHT)
      )
    );
  }, [barCount]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const ended = () => {
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    el.addEventListener("ended", ended);
    return () => {
      clearInterval(intervalRef.current);
      el.removeEventListener("ended", ended);
      el.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (audioRef.current && isFinite(audioRef.current.duration)) {
          setCurrentTime(audioRef.current.currentTime);
          setProgress(
            (audioRef.current.currentTime / audioRef.current.duration) * 100
          );
        }
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  const setupCtx = useCallback(() => {
    if (!hasActivatedRef.current) hasActivatedRef.current = true;
    if (!audioContextRef.current) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new Ctx();
      } catch (e) {
        console.error("Audio ctx create error", e);
        return;
      }
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {});
    }
    if (!analyzerRef.current) {
      try {
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 128;
        const src = audioContextRef.current.createMediaElementSource(
          audioRef.current
        );
        src.connect(analyzerRef.current);
        analyzerRef.current.connect(audioContextRef.current.destination);
      } catch (e) {
        console.error("Audio ctx wiring error", e);
      }
    }
  }, []);

  const animate = useCallback(() => {
    if (!analyzerRef.current) return;
    const len = analyzerRef.current.frequencyBinCount;
    const data = new Uint8Array(len);
    analyzerRef.current.getByteFrequencyData(data);
    const arr = [];
    const step = Math.floor(data.length / barCount) || 1;
    for (let i = 0; i < barCount; i++) {
      const start = i * step;
      let sum = 0;
      for (let j = 0; j < step && start + j < data.length; j++)
        sum += data[start + j];
      const avg = sum / step;
      const h = MIN_HEIGHT + (avg / 255) * (MAX_HEIGHT - MIN_HEIGHT);
      arr.push(Math.floor(h));
    }
    setBars(arr);
    animationRef.current = requestAnimationFrame(animate);
  }, [barCount]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      audioRef.current?.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setIsPlaying(false);
      return;
    }
    setupCtx();
    audioRef.current
      .play()
      .then(() => {
        animate();
        setIsPlaying(true);
      })
      .catch((e) => console.error("play error", e));
  }, [isPlaying, setupCtx, animate]);

  const handleSeek = useCallback((e) => {
    const pos = parseFloat(e.target.value);
    if (
      audioRef.current &&
      isFinite(audioRef.current.duration) &&
      audioRef.current.duration > 0
    ) {
      const nt = (pos * audioRef.current.duration) / 100;
      if (isFinite(nt) && !isNaN(nt) && nt >= 0) {
        audioRef.current.currentTime = nt;
        setCurrentTime(nt);
        setProgress(pos);
      }
    }
  }, []);

  const formatTime = useCallback((t) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  const getDuration = useCallback(() => {
    return duration
      ? formatTime(duration)
      : audioRef.current?.duration
      ? formatTime(audioRef.current.duration)
      : "0:00";
  }, [duration, formatTime]);

  return {
    audioRef,
    isPlaying,
    currentTime,
    progress,
    bars,
    handlePlayPause,
    handleSeek,
    getDuration,
    formatTime,
  };
}

export default useAudioMessage;
