import { useState, useRef, useEffect } from "react";
import { FiX, FiAlertCircle } from "react-icons/fi";
import { FILE_LIMITS, INPUT_LIMITS } from "@constants/appConstants";
import { toAbsoluteMediaUrl } from "@shared/lib/mediaUrl";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/textarea";
import { Alert, AlertDescription } from "@shared/ui/alert";

const revokeIfBlobUrl = (url) => {
  if (typeof url === "string" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

export default function MessageEditor({ message, onSave, onCancel }) {
  const [content, setContent] = useState(message.content || "");
  const [newMedia, setNewMedia] = useState(null);
  const [keepOriginalMedia, setKeepOriginalMedia] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(toAbsoluteMediaUrl(message.mediaUrl) || null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  useEffect(() => {
    return () => {
      revokeIfBlobUrl(previewUrl);
    };
  }, [previewUrl]);

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
        "Неподдерживаемый формат. Допустимо: изображения (JPEG, PNG, GIF) и видео (MP4, WebM)."
      );
      fileInputRef.current.value = "";
      return;
    }
    setNewMedia(file);
    setKeepOriginalMedia(false);
    revokeIfBlobUrl(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !previewUrl) {
      setError("Сообщение не может быть пустым.");
      return;
    }
    if (content.length > INPUT_LIMITS.MESSAGE_MAX_LENGTH) {
      setError(`Слишком длинно. Максимум: ${INPUT_LIMITS.MESSAGE_MAX_LENGTH}`);
      return;
    }
    const formData = new FormData();
    formData.append("content", content);
    if (newMedia) formData.append("media", newMedia);
    if (!keepOriginalMedia && !newMedia) formData.append("removeMedia", "true");
    try {
      await onSave(formData);
      revokeIfBlobUrl(previewUrl);
    } catch (err) {
      if (err.response?.status === 429)
        setError("Слишком частое редактирование. Подождите.");
      else if (err.response?.status === 413)
        setError("Файл слишком большой для сервера.");
      else setError("Не удалось сохранить изменения.");
    }
  };

  const handleRemoveMedia = () => {
    revokeIfBlobUrl(previewUrl);
    setPreviewUrl(null);
    setNewMedia(null);
    setKeepOriginalMedia(false);
  };

  return (
    <div className="bg-card rounded-lg p-3 shadow-lg w-full border border-border">
      {error && (
        <Alert variant="destructive" className="mb-3 animate-fade-in">
          <FiAlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full resize-none"
          rows={3}
          maxLength={INPUT_LIMITS.MESSAGE_MAX_LENGTH}
          autoFocus
        />
        <div className="text-xs text-muted-foreground text-right">
          {content.length}/{INPUT_LIMITS.MESSAGE_MAX_LENGTH}
        </div>
        <div className="flex items-center gap-4">
          {previewUrl && (
            <div className="relative inline-block">
              {message.mediaType === "image" ||
              newMedia?.type?.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-50 max-h-50 rounded-lg object-cover"
                />
              ) : (
                <video
                  src={previewUrl}
                  className="max-w-50 max-h-50 rounded-lg"
                  controls
                />
              )}
              <Button
                type="button"
                onClick={handleRemoveMedia}
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg">
                <FiX size={14} />
              </Button>
            </div>
          )}
          <div className="flex items-center">
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
              size="sm"
              className="h-8">
              {previewUrl ? "Заменить медиа" : "Добавить медиа"}
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            className="h-8">
            Сохранить
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            size="sm"
            className="h-8">
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}
