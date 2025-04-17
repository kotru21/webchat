import { useState, useRef, useEffect } from "react";
import { BsMicFill, BsStopFill } from "react-icons/bs";
import { FaTrash } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import { FILE_LIMITS } from "../../constants/appConstants";

/**
 * Компонент для записи, предпросмотра и отправки голосовых сообщений
 */
const VoiceRecorder = ({ onVoiceRecorded, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // Очистка ресурсов при размонтировании компонента
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      stopMediaTracks();
    };
  }, [audioUrl]);

  // Остановка всех медиапотоков
  const stopMediaTracks = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  // Начало записи голосового сообщения
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Проверяем размер файла
        if (audioBlob.size > FILE_LIMITS.VOICE_MESSAGE_MAX_SIZE) {
          alert(
            `Голосовое сообщение слишком большое. Максимальный размер: ${
              FILE_LIMITS.VOICE_MESSAGE_MAX_SIZE / (1024 * 1024)
            }MB`
          );
          resetRecording();
          return;
        }

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setAudioBlob(audioBlob);
        setIsRecording(false);

        // Если таймер записи работал, используем его значение для длительности
        if (recordingTime > 0) {
          setDuration(recordingTime);
          setIsAudioReady(true);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Запуск таймера записи
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= FILE_LIMITS.VOICE_MESSAGE_MAX_DURATION) {
            stopRecording();
            return FILE_LIMITS.VOICE_MESSAGE_MAX_DURATION;
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error("Ошибка доступа к микрофону:", error);
      alert("Не удалось получить доступ к микрофону. Проверьте разрешения.");
    }
  };

  // Остановка записи
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      stopMediaTracks();
    }
  };

  // Сброс состояния записи
  const resetRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopMediaTracks();
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setDuration(0);
    setIsAudioReady(false);
    audioChunksRef.current = [];
  };

  // Форматирование времени для отображения
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Обработчик метаданных аудио
  const handleAudioMetadata = () => {
    if (
      audioRef.current &&
      !isNaN(audioRef.current.duration) &&
      audioRef.current.duration !== Infinity
    ) {
      const audioDuration = Math.round(audioRef.current.duration);
      setDuration(audioDuration);
      setIsAudioReady(true);
    } else if (recordingTime > 0) {
      // Если не удалось получить длительность через метаданные, используем время записи
      setDuration(recordingTime);
      setIsAudioReady(true);
    }
  };

  // Отправка голосового сообщения
  const handleSend = () => {
    if (!audioBlob) return;

    // Используем время записи, если метаданные недоступны
    const finalDuration = duration || recordingTime || 1; // Минимум 1 секунда по умолчанию

    // Создаем файл с метаданными
    const audioFile = new File(
      [audioBlob],
      `voice_message_${Date.now()}.webm`,
      {
        type: "audio/webm",
        lastModified: Date.now(),
      }
    );

    onVoiceRecorded(audioFile, finalDuration);
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow-md animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {isRecording
            ? `Запись: ${formatTime(recordingTime)}`
            : audioBlob
            ? "Готово к отправке"
            : "Голосовое сообщение"}
        </div>

        {!isRecording && audioUrl && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(duration || recordingTime)}
          </div>
        )}
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          className="w-full mb-2"
          onLoadedMetadata={handleAudioMetadata}
        />
      )}

      <div className="flex justify-center gap-4">
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all transform hover:scale-105"
            aria-label="Начать запись">
            <BsMicFill size={20} />
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full animate-pulse transition-all transform hover:scale-105"
            aria-label="Остановить запись">
            <BsStopFill size={20} />
          </button>
        )}

        {audioBlob && (
          <>
            <button
              onClick={resetRecording}
              className="p-3 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-all transform hover:scale-105"
              aria-label="Отменить запись">
              <FaTrash size={16} />
            </button>

            <button
              onClick={handleSend}
              className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all transform hover:scale-105"
              aria-label="Отправить голосовое сообщение">
              <MdSend size={20} />
            </button>
          </>
        )}

        {(isRecording || audioBlob) && (
          <button
            onClick={onCancel}
            className="p-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-all"
            aria-label="Отмена">
            Отмена
          </button>
        )}
      </div>

      {isRecording && (
        <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
          Максимальная длительность:{" "}
          {formatTime(FILE_LIMITS.VOICE_MESSAGE_MAX_DURATION)}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
