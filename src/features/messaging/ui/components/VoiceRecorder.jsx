// VoiceRecorder feature component
import { useState, useRef, useEffect } from "react";
import { BsMicFill, BsStopFill } from "react-icons/bs";
import { FaTrash } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import { FILE_LIMITS } from "../../../../constants/appConstants";

const VoiceRecorder = ({ onVoiceRecorded, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      stopMediaTracks();
    },
    [audioUrl]
  );

  const stopMediaTracks = () => {
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size > FILE_LIMITS.VOICE_MESSAGE_MAX_SIZE) {
          alert(
            `Голосовое сообщение слишком большое. Максимум ${
              FILE_LIMITS.VOICE_MESSAGE_MAX_SIZE / (1024 * 1024)
            }MB`
          );
          resetRecording();
          return;
        }
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);
        setIsRecording(false);
        if (recordingTime > 0) setDuration(recordingTime);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          if (next >= FILE_LIMITS.VOICE_MESSAGE_MAX_DURATION) {
            stopRecording();
            return FILE_LIMITS.VOICE_MESSAGE_MAX_DURATION;
          }
          return next;
        });
      }, 1000);
    } catch (e) {
      console.error("mic error", e);
      alert("Не удалось получить доступ к микрофону");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      stopMediaTracks();
    }
  };

  const resetRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopMediaTracks();
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setDuration(0);
    audioChunksRef.current = [];
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const handleAudioMetadata = () => {
    if (
      audioRef.current &&
      !isNaN(audioRef.current.duration) &&
      audioRef.current.duration !== Infinity
    ) {
      setDuration(Math.round(audioRef.current.duration));
    } else if (recordingTime > 0) setDuration(recordingTime);
  };
  const handleSend = () => {
    if (!audioBlob) return;
    const finalDuration = duration || recordingTime || 1;
    const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
      type: "audio/webm",
      lastModified: Date.now(),
    });
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
            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full"
            aria-label="Начать запись">
            <BsMicFill size={20} />
          </button>
        )}
        {isRecording && (
          <button
            onClick={stopRecording}
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full animate-pulse"
            aria-label="Остановить запись">
            <BsStopFill size={20} />
          </button>
        )}
        {audioBlob && (
          <>
            <button
              onClick={resetRecording}
              className="p-3 bg-gray-500 hover:bg-gray-600 text-white rounded-full"
              aria-label="Отменить запись">
              <FaTrash size={16} />
            </button>
            <button
              onClick={handleSend}
              className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
              aria-label="Отправить голосовое сообщение">
              <MdSend size={20} />
            </button>
          </>
        )}
        {(isRecording || audioBlob) && (
          <button
            onClick={onCancel}
            className="p-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full"
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
