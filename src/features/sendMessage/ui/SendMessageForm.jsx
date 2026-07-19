import { memo, useCallback, useState } from "react";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiLoader,
  FiLock,
  FiMic,
  FiPaperclip,
  FiSend,
  FiUnlock,
} from "react-icons/fi";
import VoiceRecorder from "@features/recordVoice/ui/VoiceRecorder";
import { INPUT_LIMITS } from "@constants/appConstants";
import { useSendMessageForm } from "../model/useSendMessageForm";
import { usePeerE2ee } from "@features/e2ee/model/usePeerE2ee.js";
import { formatFingerprint } from "@features/e2ee/lib/formatFingerprint.js";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { notify } from "@features/notifications/notify";

function ComposerE2eeStatus({ status }) {
  if (status === "encrypted") {
    return (
      <span className="inline-flex items-center gap-1.5" data-status="encrypted">
        <FiLock size={12} aria-hidden />
        зашифровано
      </span>
    );
  }
  if (status === "changed" || status === "locked") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-destructive"
        data-status={status}>
        <FiAlertTriangle size={12} aria-hidden />
        ключ изменился
      </span>
    );
  }
  if (status === "loading") {
    return (
      <span data-status="loading">…</span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5" data-status="plain">
      <FiUnlock size={12} aria-hidden />
      не зашифровано
    </span>
  );
}

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

  const peerE2ee = usePeerE2ee(receiverId);
  const sendBlocked = peerE2ee.sendBlocked;
  const [trustBusy, setTrustBusy] = useState(false);

  const acceptKey = useCallback(async () => {
    setTrustBusy(true);
    try {
      await peerE2ee.acceptNewKey();
      notify("success", "Новый ключ принят");
    } catch {
      notify("error", "Не удалось принять ключ");
    } finally {
      setTrustBusy(false);
    }
  }, [peerE2ee]);

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
          id="message-composer"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            sendBlocked
              ? "Отправка заблокирована — проверьте ключ"
              : "Сообщение..."
          }
          aria-label="Текст сообщения"
          className="h-12 min-w-0 flex-1 rounded-full bg-background/85 px-4"
          maxLength={INPUT_LIMITS.MESSAGE_MAX_LENGTH}
          disabled={sendBlocked}
        />
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*, video/mp4, video/webm"
          className="hidden"
          aria-hidden
          tabIndex={-1}
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0"
          disabled={loading || sendBlocked}
          aria-label="Прикрепить файл">
          <FiPaperclip size={20} aria-hidden />
        </Button>
        <Button
          type="button"
          onClick={startRecording}
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0"
          disabled={loading || sendBlocked}
          aria-label="Записать голосовое сообщение">
          <FiMic size={20} aria-hidden />
        </Button>
        <Button
          type="submit"
          disabled={loading || sendBlocked}
          size="icon"
          className="h-12 w-12 shrink-0 transition-transform duration-150 active:scale-95 data-[sending=true]:scale-95"
          data-sending={loading || undefined}
          aria-label={loading ? "Отправка…" : "Отправить сообщение"}
          aria-busy={loading}>
          {loading ? (
            <FiLoader size={20} className="animate-spin" aria-hidden />
          ) : (
            <FiSend size={20} className="translate-x-px" aria-hidden />
          )}
        </Button>
      </div>
    );
  };

  return (
    <form
      onSubmit={submit}
      className="m3-surface-high animate-slide-up border-t border-border/70 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 transition-all duration-300 md:rounded-b-4xl">
      <div
        className="mb-2 text-xs text-muted-foreground"
        data-testid="e2ee-composer-status"
        role="status">
        <ComposerE2eeStatus status={peerE2ee.status} />
      </div>
      {(peerE2ee.status === "changed" || peerE2ee.status === "locked") && (
        <Alert variant="destructive" className="mb-3 animate-fade-in">
          <FiAlertCircle className="h-4 w-4" aria-hidden />
          <AlertTitle>
            {peerE2ee.status === "locked"
              ? "Возможная атака downgrade"
              : "Ключ собеседника изменился"}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {peerE2ee.status === "locked"
                ? "Сервер не отдаёт ключ собеседника, а у вас есть закреплённый — отправка заблокирована."
                : "Сверьте отпечатки вне канала и подтвердите новый ключ, если ожидаете смену."}
            </p>
            {peerE2ee.status === "changed" ? (
              <div className="space-y-1 font-mono text-[13px] leading-5 text-foreground">
                <p>
                  <span className="font-sans font-medium">Было: </span>
                  {formatFingerprint(peerE2ee.pinnedFingerprint) || "—"}
                </p>
                <p>
                  <span className="font-sans font-medium">Стало: </span>
                  {formatFingerprint(peerE2ee.peerFingerprint) || "—"}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-1"
                  disabled={trustBusy}
                  aria-busy={trustBusy}
                  onClick={acceptKey}
                  data-testid="e2ee-trust-new-key-composer">
                  Доверять новому ключу
                </Button>
              </div>
            ) : null}
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-3 animate-fade-in">
          <FiAlertCircle className="h-4 w-4" aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {renderInputArea()}
      {selectedFile && !isRecording && (
        <div
          className="mt-2 truncate px-1 text-xs text-muted-foreground motion-safe:animate-fade-in"
          role="status"
          aria-live="polite">
          Файл: {selectedFile.name}
        </div>
      )}
    </form>
  );
});
