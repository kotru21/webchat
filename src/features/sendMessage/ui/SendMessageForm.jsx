import { memo } from "react";
import { IoMdAttach, IoMdSend } from "react-icons/io";
import { BiLoaderAlt } from "react-icons/bi";
import { FiAlertCircle } from "react-icons/fi";
import { BsMicFill } from "react-icons/bs";
import VoiceRecorder from "../../messaging/ui/components/VoiceRecorder"; // TODO: перенести в feature recordVoice
import { INPUT_LIMITS } from "@constants/appConstants";
import { useSendMessageForm } from "../model/useSendMessageForm";

export const SendMessageForm = memo(function SendMessageForm({
  receiverId,
  onSent,
}) {
  const {
    text,
    setText,
    selectedFile,
    error,
    isRecording,
    loading,
    fileInputRef,
    handleFileSelect,
    submit,
    sendVoice,
    startRecording,
    cancelRecording,
  } = useSendMessageForm({ receiverId, onSent });

  const renderInputArea = () => {
    if (isRecording) {
      return (
        <VoiceRecorder onVoiceRecorded={sendVoice} onCancel={cancelRecording} />
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
          onClick={startRecording}
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
      onSubmit={submit}
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
