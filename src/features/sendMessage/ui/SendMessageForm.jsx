import { memo, useEffect, useRef, useState } from "react";
import { IoMdAttach, IoMdSend } from "react-icons/io";
import { BiLoaderAlt } from "react-icons/bi";
import { FiAlertCircle } from "react-icons/fi";
import { BsMicFill } from "react-icons/bs";
import { useSendMessage } from "../index";
import VoiceRecorder from "../../messaging/ui/components/VoiceRecorder"; // bridge, позже перенести в feature recordVoice
import { FILE_LIMITS, INPUT_LIMITS } from "../../../constants/appConstants";

export const SendMessageForm = memo(function SendMessageForm({
  receiverId,
  onSent,
}) {
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > FILE_LIMITS.MESSAGE_MEDIA_MAX_SIZE) {
      setError(
        `Файл слишком большой. Максимальный размер: ${
          FILE_LIMITS.MESSAGE_MEDIA_MAX_SIZE / (1024 * 1024)
        }MB`
      );
      fileInputRef.current.value = "";
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
      fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const handleSubmit = async (e) => {
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
  };

  const handleVoiceRecorded = async (audioFile, duration) => {
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
  };

  const renderInputArea = () => {
    if (isRecording) {
      return (
        <VoiceRecorder
          onVoiceRecorded={handleVoiceRecorded}
          onCancel={() => setIsRecording(false)}
        />
      );
    }
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сообщение..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white min-w-0 transition-all duration-200 focus:shadow-md"
          disabled={loading}
          maxLength={INPUT_LIMITS.MESSAGE_MAX_LENGTH}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*, video/mp4, video/webm"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex-shrink-0 transition-colors duration-200 transform hover:scale-105"
          aria-label="Прикрепить файл">
          <IoMdAttach size={20} />
        </button>
        <button
          type="button"
          onClick={() => setIsRecording(true)}
          className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex-shrink-0 transition-colors duration-200 transform hover:scale-105"
          aria-label="Записать голосовое сообщение">
          <BsMicFill size={20} />
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 pl-6 pr-6 md:pr-2 md:pl-2 transition-all duration-200 transform hover:scale-105 ripple-effect hover-scale ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}>
          {loading ? (
            <BiLoaderAlt size={20} className="animate-spin" />
          ) : (
            <IoMdSend size={20} />
          )}
        </button>
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-2 sm:p-4 pb-10 lg:pb-4 transition-all duration-300 animate-slide-up">
      {error && (
        <div className="mb-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm p-2 rounded-lg flex items-center animate-fade-in">
          <FiAlertCircle className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {renderInputArea()}
      {selectedFile && !isRecording && (
        <div className="mt-2 text-xs text-gray-500 truncate px-2 animate-fadeIn">
          Файл: {selectedFile.name}
        </div>
      )}
    </form>
  );
});
