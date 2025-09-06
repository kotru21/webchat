import { memo, useState } from "react";
import AudioMessage from "@entities/message/ui/AudioMessage";

function buildAbsolute(url) {
  if (!url) return "";
  const base = import.meta.env.VITE_API_URL || "";
  // если уже абсолютный (http/https/blob/data)
  if (/^(?:https?:|blob:|data:)/i.test(url)) return url;
  // избегаем двойных слэшей
  return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

function MessageMediaComponent({ message, onMediaClick }) {
  const [errored, setErrored] = useState(false);

  if (message.isDeleted || !message.mediaUrl) return null;
  const abs = buildAbsolute(message.mediaUrl);

  if (message.mediaType === "image") {
    return (
      <img
        src={errored ? undefined : abs}
        alt={errored ? "Ошибка загрузки" : "Изображение"}
        loading="lazy"
        decoding="async"
        className="mt-2 inline-block cursor-pointer lg:max-w-[400px] lg:max-h-[400px] max-w-[200px] rounded-lg hover:opacity-90 transition-opacity object-contain bg-neutral-200 dark:bg-neutral-700"
        onClick={(e) => {
          e.stopPropagation();
          if (!errored) onMediaClick(message.mediaUrl, "image");
        }}
        onError={() => setErrored(true)}
      />
    );
  }
  if (message.mediaType === "video") {
    return (
      <video
        src={abs}
        className="max-w-[400px] max-h-[400px] rounded-lg mt-2 cursor-pointer hover:opacity-90 transition-opacity object-contain bg-black/20"
        controls
        onClick={(e) => {
          e.stopPropagation();
          onMediaClick(message.mediaUrl, "video");
        }}
      />
    );
  }
  if (message.mediaType === "audio") {
    return (
      <div className="w-full mt-2">
        <AudioMessage audioUrl={abs} duration={message.audioDuration} />
      </div>
    );
  }
  return null;
}

export default memo(MessageMediaComponent);
