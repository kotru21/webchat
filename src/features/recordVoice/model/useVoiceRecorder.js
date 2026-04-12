import { useCallback, useEffect, useRef, useState } from "react";
import { FILE_LIMITS } from "@constants/appConstants";

const MAX_SIZE_MB = FILE_LIMITS.VOICE_MESSAGE_MAX_SIZE / (1024 * 1024);

export function useVoiceRecorder({ onVoiceRecorded }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(undefined);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const audioRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const revokeAudioUrl = useCallback((url) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const stopMediaTracks = useCallback(() => {
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const stopRecording = useCallback(() => {
    clearTimer();
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      stopMediaTracks();
    }
  }, [clearTimer, stopMediaTracks]);

  const resetRecording = useCallback(() => {
    clearTimer();
    stopMediaTracks();
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    setDuration(0);
    setError(undefined);
    audioChunksRef.current = [];
    setAudioUrl((prev) => {
      revokeAudioUrl(prev);
      return null;
    });
  }, [clearTimer, revokeAudioUrl, stopMediaTracks]);

  const startRecording = useCallback(async () => {
    try {
      setError(undefined);
      audioChunksRef.current = [];
      recordingTimeRef.current = 0;
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        if (blob.size > FILE_LIMITS.VOICE_MESSAGE_MAX_SIZE) {
          setError(`Голосовое сообщение слишком большое. Максимум ${MAX_SIZE_MB}MB`);
          resetRecording();
          return;
        }

        const url = URL.createObjectURL(blob);
        setAudioUrl((prev) => {
          revokeAudioUrl(prev);
          return url;
        });

        setAudioBlob(blob);
        setIsRecording(false);

        if (recordingTimeRef.current > 0) {
          setDuration(recordingTimeRef.current);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          recordingTimeRef.current = next;

          if (next >= FILE_LIMITS.VOICE_MESSAGE_MAX_DURATION) {
            stopRecording();
            return FILE_LIMITS.VOICE_MESSAGE_MAX_DURATION;
          }

          return next;
        });
      }, 1000);
    } catch {
      setError("Не удалось получить доступ к микрофону");
    }
  }, [resetRecording, revokeAudioUrl, stopRecording]);

  const handleAudioMetadata = useCallback(() => {
    const audioElement = audioRef.current;
    if (
      audioElement &&
      !isNaN(audioElement.duration) &&
      audioElement.duration !== Infinity
    ) {
      setDuration(Math.round(audioElement.duration));
      return;
    }

    if (recordingTime > 0) {
      setDuration(recordingTime);
    }
  }, [recordingTime]);

  const handleSend = useCallback(() => {
    if (!audioBlob) {
      return;
    }

    const finalDuration = duration || recordingTime || 1;
    const now = Date.now();
    const audioFile = new File([audioBlob], `voice_${now}.webm`, {
      type: "audio/webm",
      lastModified: now,
    });

    onVoiceRecorded(audioFile, finalDuration);
  }, [audioBlob, duration, onVoiceRecorded, recordingTime]);

  const formatTime = useCallback(
    (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`,
    []
  );

  useEffect(
    () => () => {
      clearTimer();
      stopMediaTracks();
      revokeAudioUrl(audioUrl);
    },
    [audioUrl, clearTimer, revokeAudioUrl, stopMediaTracks]
  );

  return {
    isRecording,
    audioBlob,
    duration,
    recordingTime,
    audioUrl,
    error,
    audioRef,
    formatTime,
    startRecording,
    stopRecording,
    resetRecording,
    handleAudioMetadata,
    handleSend,
  };
}

export default useVoiceRecorder;
