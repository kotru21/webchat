import { useState, useRef, useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

export default function AudioMessage({ audioUrl, duration }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [bars, setBars] = useState([]);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const analyzerRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationRef = useRef(null);

  const BAR_COUNT = 40;
  const MIN_HEIGHT = 2;
  const MAX_HEIGHT = 25;

  useEffect(() => {
    setBars(
      Array.from({ length: BAR_COUNT }, () =>
        Math.floor(Math.random() * (MAX_HEIGHT - MIN_HEIGHT) + MIN_HEIGHT)
      )
    );
  }, []);

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
      if (audioContextRef.current && audioContextRef.current.state !== "closed")
        audioContextRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
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

  const setupCtx = () => {
    if (!audioContextRef.current) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new Ctx();
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 128;
        const src = audioContextRef.current.createMediaElementSource(
          audioRef.current
        );
        src.connect(analyzerRef.current);
        analyzerRef.current.connect(audioContextRef.current.destination);
      } catch (e) {
        console.error("Audio ctx error", e);
      }
    }
  };

  const animate = () => {
    if (!analyzerRef.current) return;
    const len = analyzerRef.current.frequencyBinCount;
    const data = new Uint8Array(len);
    analyzerRef.current.getByteFrequencyData(data);
    const arr = [];
    const step = Math.floor(data.length / BAR_COUNT) || 1;
    for (let i = 0; i < BAR_COUNT; i++) {
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
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      setupCtx();
      audioRef.current
        .play()
        .then(() => animate())
        .catch((e) => console.error("play error", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
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
  };

  const format = (t) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  const getDuration = () =>
    duration
      ? format(duration)
      : audioRef.current?.duration
      ? format(audioRef.current.duration)
      : "0:00";

  return (
    <div className="flex flex-col p-2 w-full max-w-md">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        crossOrigin="anonymous"
      />
      <div className="flex items-center">
        <button
          onClick={handlePlayPause}
          className={`p-3 rounded-full ${
            isPlaying ? "bg-red-500" : "bg-blue-500"
          } text-white mr-3 flex-shrink-0 transition-colors duration-300`}
          aria-label={isPlaying ? "Пауза" : "Воспроизвести"}>
          {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
        </button>
        <div className="w-full h-14 bg-gray-100 dark:bg-gray-800 rounded-lg p-2 flex items-end gap-[2px] overflow-hidden relative">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex-grow flex justify-between w-full h-full">
            <span className="mr-2">{format(currentTime)}</span>
            <div
              className="absolute left-0 bottom-0 bg-blue-500/20 h-full transition-all duration-100 pointer-events-none"
              style={{ width: `${progress}%` }}
            />
            <div className="flex items-end gap-[2px] w-full h-full relative">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className={`rounded-sm flex-1 ${
                    isPlaying
                      ? "bg-blue-500 dark:bg-blue-400"
                      : "bg-gray-400 dark:bg-gray-600"
                  }`}
                  style={{
                    height: `${h}px`,
                    minWidth: "2px",
                    transition: "height 0.1s ease",
                  }}
                />
              ))}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer"
            />
            <span className="ml-2">{getDuration()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
