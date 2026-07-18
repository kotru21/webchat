import { memo } from "react";
import { IoMdAttach, IoMdSend } from "react-icons/io";
import { BiLoaderAlt } from "react-icons/bi";
import { FiAlertCircle } from "react-icons/fi";
import { BsMicFill } from "react-icons/bs";
import VoiceRecorder from "@features/recordVoice/ui/VoiceRecorder";
import { INPUT_LIMITS } from "@constants/appConstants";
import { useSendMessageForm } from "../model/useSendMessageForm";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Alert, AlertDescription } from "@shared/ui/alert";

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
    textInputRef,
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
      <div className="flex items-center gap-3">
        <Input
          ref={textInputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сообщение..."
          className="h-12 min-w-0 flex-1 rounded-full bg-background/85 px-4"
          maxLength={INPUT_LIMITS.MESSAGE_MAX_LENGTH}
        />
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*, video/mp4, video/webm"
          className="hidden"
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0"
          disabled={loading}
          aria-label="Прикрепить файл">
          <IoMdAttach size={20} />
        </Button>
        <Button
          type="button"
          onClick={startRecording}
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0"
          disabled={loading}
          aria-label="Записать голосовое сообщение">
          <BsMicFill size={20} />
        </Button>
        <Button
          type="submit"
          disabled={loading}
          size="icon"
          className="h-12 w-12 shrink-0">
          {loading ? (
            <BiLoaderAlt size={20} className="animate-spin" />
          ) : (
            <IoMdSend size={20} />
          )}
        </Button>
      </div>
    );
  };

  return (
    <form
      onSubmit={submit}
      className="m3-surface-high animate-slide-up border-t border-border/70 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 transition-all duration-300 md:rounded-b-4xl">
      {error && (
        <Alert variant="destructive" className="mb-3 animate-fade-in">
          <FiAlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {renderInputArea()}
      {selectedFile && !isRecording && (
        <div className="mt-2 truncate px-1 text-xs text-muted-foreground animate-fadeIn">
          Файл: {selectedFile.name}
        </div>
      )}
    </form>
  );
});
