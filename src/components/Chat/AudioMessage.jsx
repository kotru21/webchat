import { useState, useRef, useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

/**
 * Компонент для отображения и воспроизведения голосовых сообщений
 * с визуализацией в виде эквалайзера
 */
const AudioMessage = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [bars, setBars] = useState([]);

  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const analyzerRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationRef = useRef(null);

  // Количество полос в эквалайзере
  const BAR_COUNT = 40;
  const MIN_HEIGHT = 2;
  const MAX_HEIGHT = 25;

  // Генерация случайных значений для полос эквалайзера
  useEffect(() => {
    // Инициализация начальных значений полос
    const initialBars = Array.from({ length: BAR_COUNT }, () =>
      Math.floor(Math.random() * (MAX_HEIGHT - MIN_HEIGHT) + MIN_HEIGHT)
    );
    setBars(initialBars);
  }, []);

  // Инициализация и очистка ресурсов
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleEnded = () => {
        setIsPlaying(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };

      audioElement.addEventListener("ended", handleEnded);

      return () => {
        clearInterval(intervalRef.current);
        audioElement.removeEventListener("ended", handleEnded);
        audioElement.pause();

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        if (
          audioContextRef.current &&
          audioContextRef.current.state !== "closed"
        ) {
          audioContextRef.current.close();
        }
      };
    }
  }, []);

  // Обновление времени воспроизведения
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

  // Создание аудиоконтекста и подключение анализатора
  const setupAudioContext = () => {
    if (!audioContextRef.current) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 128;

        const source = audioContextRef.current.createMediaElementSource(
          audioRef.current
        );
        source.connect(analyzerRef.current);
        analyzerRef.current.connect(audioContextRef.current.destination);
      } catch (error) {
        console.error("Ошибка при создании аудиоконтекста:", error);
      }
    }
  };

  // Анимация эквалайзера
  const animateEqualizer = () => {
    if (!analyzerRef.current) return;

    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzerRef.current.getByteFrequencyData(dataArray);

    const barValues = [];
    const step = Math.floor(dataArray.length / BAR_COUNT) || 1;

    // Сжимаем данные анализатора в меньшее количество столбцов
    for (let i = 0; i < BAR_COUNT; i++) {
      const startIndex = i * step;
      let sum = 0;

      for (let j = 0; j < step && startIndex + j < dataArray.length; j++) {
        sum += dataArray[startIndex + j];
      }

      const average = sum / step;
      // Преобразуем значение в высоту столбца (от MIN_HEIGHT до MAX_HEIGHT)
      const barHeight =
        MIN_HEIGHT + (average / 255) * (MAX_HEIGHT - MIN_HEIGHT);
      barValues.push(Math.floor(barHeight));
    }

    setBars(barValues);
    animationRef.current = requestAnimationFrame(animateEqualizer);
  };

  // Обработчик воспроизведения/паузы
  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      setupAudioContext();
      audioRef.current
        .play()
        .then(() => {
          // Запускаем анимацию эквалайзера
          animateEqualizer();
        })
        .catch((error) => {
          console.error("Ошибка воспроизведения:", error);
        });
    }
    setIsPlaying(!isPlaying);
  };

  // Обработчик перемотки
  const handleSeek = (e) => {
    const newPosition = parseFloat(e.target.value);
    if (
      audioRef.current &&
      audioRef.current.duration &&
      isFinite(audioRef.current.duration) &&
      audioRef.current.duration > 0
    ) {
      const newTime = (newPosition * audioRef.current.duration) / 100;

      // Проверяем, что значение newTime является корректным числом
      if (isFinite(newTime) && !isNaN(newTime) && newTime >= 0) {
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        setProgress(newPosition);
      }
    }
  };

  // Форматирование времени (00:00)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Вычисление длительности, если она не передана
  const getDuration = () => {
    if (duration) return formatTime(duration);
    if (audioRef.current && audioRef.current.duration)
      return formatTime(audioRef.current.duration);
    return "0:00";
  };

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
          className={`p-3 rounded-full bg-gray-100 dark:bg-gray-800 ${
            isPlaying ? "bg-red-500" : "bg-blue-500"
          } text-white mr-3 flex-shrink-0 transition-colors duration-300`}
          aria-label={isPlaying ? "Пауза" : "Воспроизвести"}>
          {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
        </button>

        {/* Эквалайзер */}
        <div
          className="w-full h-14 bg-gray-100 dark:bg-gray-800 rounded-lg p-2 flex items-end gap-[2px] overflow-hidden"
          style={{ position: "relative" }}>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex-grow flex justify-between">
            <span className="mr-2">{formatTime(currentTime)}</span>

            {/* Индикатор прогресса */}
            <div
              className="absolute left-0 bottom-0 bg-blue-500/20 h-full transition-all duration-100 pointer-events-none"
              style={{ width: `${progress}%` }}
            />

            {/* Полосы эквалайзера */}
            <div className="flex items-end gap-[2px] w-full h-full relative">
              {bars.map((height, index) => (
                <div
                  key={index}
                  className={`rounded-sm flex-1 ${
                    isPlaying
                      ? "bg-blue-500 dark:bg-blue-400"
                      : "bg-gray-400 dark:bg-gray-600"
                  } transition-height duration-100`}
                  style={{
                    height: `${height}px`,
                    minWidth: "2px",
                    transition: "height 0.1s ease",
                  }}
                />
              ))}
            </div>

            {/* Перетаскиваемый элемент для скраббинга (невидимый) */}
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
};

export default AudioMessage;
