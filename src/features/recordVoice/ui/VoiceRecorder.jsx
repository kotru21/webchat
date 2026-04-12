import { BsMicFill, BsStopFill } from "react-icons/bs";
import { FaTrash } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import { FiAlertCircle } from "react-icons/fi";
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
    <div className="bg-muted/40 border border-border p-3 rounded-lg shadow-sm animate-fade-in">
      {error && (
        <Alert variant="destructive" className="mb-3">
          <FiAlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex items-center justify-between mb-2">
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
          className="w-full mb-2 rounded-md"
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
            <BsMicFill size={20} />
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
            <BsStopFill size={20} />
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
              <FaTrash size={16} />
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              size="icon"
              className="h-11 w-11 rounded-full"
              aria-label="Отправить голосовое сообщение">
              <MdSend size={20} />
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
        <div className="mt-2 text-xs text-center text-muted-foreground">
          Максимальная длительность: {formatTime(FILE_LIMITS.VOICE_MESSAGE_MAX_DURATION)}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
