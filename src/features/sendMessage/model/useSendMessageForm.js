import { useState, useRef, useEffect, useCallback } from "react";
import { useSendMessage } from "../index";
import { FILE_LIMITS, INPUT_LIMITS } from "@constants/appConstants";

export function useSendMessageForm({ receiverId, onSent }) {
  const { send, loading } = useSendMessage({ receiverId });
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const selectFile = useCallback((file) => {
    if (!file) return;
    if (file.size > FILE_LIMITS.MESSAGE_MEDIA_MAX_SIZE) {
      setError(
        `Файл слишком большой. Максимальный размер: ${
          FILE_LIMITS.MESSAGE_MEDIA_MAX_SIZE / (1024 * 1024)
        }MB`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/webm",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError(
        "Неподдерживаемый формат файла. Разрешены: JPEG, PNG, GIF, MP4, WebM"
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
    setError(null);
  }, []);

  const handleFileSelect = useCallback(
    (e) => {
      const f = e.target.files[0];
      selectFile(f);
    },
    [selectFile]
  );

  const submit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!text.trim() && !selectedFile) return;
      if (text.length > INPUT_LIMITS.MESSAGE_MAX_LENGTH) {
        setError(
          `Сообщение слишком длинное. Максимум: ${INPUT_LIMITS.MESSAGE_MAX_LENGTH}`
        );
        return;
      }
      const result = await send({ text: text.trim(), file: selectedFile });
      if (result?.ok) {
        setText("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onSent?.(result.value);
      } else if (result?.error?.response?.status === 429) {
        setError("Слишком часто. Подождите.");
      } else if (result && !result.ok) {
        setError(result.error?.message || "Не удалось отправить сообщение");
      }
    },
    [onSent, selectedFile, send, text]
  );

  const sendVoice = useCallback(
    async (audioFile, duration) => {
      const result = await send({
        file: audioFile,
        mediaType: "audio",
        audioDuration: duration,
      });
      if (result?.ok) {
        setIsRecording(false);
        onSent?.(result.value);
      } else if (result?.error?.response?.status === 429) {
        setError("Слишком часто. Подождите.");
      } else if (result && !result.ok) {
        setError(
          result.error?.message || "Не удалось отправить голосовое сообщение"
        );
      }
    },
    [onSent, send]
  );

  return {
    // state
    text,
    setText,
    selectedFile,
    error,
    isRecording,
    loading,
    // refs
    fileInputRef,
    // actions
    handleFileSelect,
    submit,
    sendVoice,
    startRecording: () => setIsRecording(true),
    cancelRecording: () => setIsRecording(false),
  };
}

export default useSendMessageForm;
