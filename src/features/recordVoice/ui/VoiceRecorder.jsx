import { FiAlertCircle, FiMic, FiSend, FiSquare, FiTrash2 } from "react-icons/fi";
import { FILE_LIMITS } from "@constants/appConstants";
import { Button } from "@shared/ui/button";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { useVoiceRecorder } from "@features/recordVoice/model/useVoiceRecorder";

const VoiceRecorder = ({ onVoiceRecorded, onCancel }) => {
  const {
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
  } = useVoiceRecorder({ onVoiceRecorded });

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 shadow-sm animate-fade-in">
      {error && (
        <Alert variant="destructive" className="mb-3">
          <FiAlertCircle className="h-4 w-4" aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">
          {isRecording
            ? `Запись: ${formatTime(recordingTime)}`
            : audioBlob
              ? "Готово к отправке"
              : "Голосовое сообщение"}
        </div>
        {!isRecording && audioUrl && (
          <div className="text-xs text-muted-foreground">
            {formatTime(duration || recordingTime)}
          </div>
        )}
      </div>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          className="mb-2 w-full rounded-md"
          onLoadedMetadata={handleAudioMetadata}
        />
      )}
      <div className="flex justify-center gap-4">
        {!isRecording && !audioBlob && (
          <Button
            type="button"
            onClick={startRecording}
            variant="destructive"
            size="icon"
            className="h-11 w-11 rounded-full"
            aria-label="Начать запись">
            <FiMic size={20} aria-hidden />
          </Button>
        )}
        {isRecording && (
          <Button
            type="button"
            onClick={stopRecording}
            variant="destructive"
            size="icon"
            className="h-11 w-11 rounded-full animate-pulse"
            aria-label="Остановить запись">
            <FiSquare size={18} aria-hidden />
          </Button>
        )}
        {audioBlob && (
          <>
            <Button
              type="button"
              onClick={resetRecording}
              variant="secondary"
              size="icon"
              className="h-11 w-11 rounded-full"
              aria-label="Отменить запись">
              <FiTrash2 size={16} aria-hidden />
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              size="icon"
              className="h-11 w-11 rounded-full"
              aria-label="Отправить голосовое сообщение">
              <FiSend size={20} aria-hidden />
            </Button>
          </>
        )}
        {(isRecording || audioBlob) && (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="rounded-full px-4"
            aria-label="Отмена">
            Отмена
          </Button>
        )}
      </div>
      {isRecording && (
        <div className="mt-2 text-center text-xs text-muted-foreground">
          Максимальная длительность:{" "}
          {formatTime(FILE_LIMITS.VOICE_MESSAGE_MAX_DURATION)}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
