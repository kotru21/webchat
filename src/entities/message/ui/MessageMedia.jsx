import { memo } from "react";
import AudioMessage from "@entities/message/ui/AudioMessage";

function MessageMediaComponent({ message, onMediaClick }) {
  if (message.isDeleted || !message.mediaUrl) return null;
  const base = import.meta.env.VITE_API_URL;
  if (message.mediaType === "image") {
    const full = `${base}${message.mediaUrl}`;
    const webp = full.replace(/(\.[a-zA-Z0-9]+)$/i, ".webp");
    return (
      <picture
        className="mt-2 inline-block cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onMediaClick(message.mediaUrl, "image");
        }}>
        <source srcSet={webp} type="image/webp" />
        <img
          src={full}
          alt="Изображение"
          loading="lazy"
          decoding="async"
          className="lg:max-w-[400px] lg:max-h-[400px] max-w-[200px] rounded-lg hover:opacity-90 transition-opacity object-contain"
        />
      </picture>
    );
  }
  if (message.mediaType === "video") {
    return (
      <video
        src={`${base}${message.mediaUrl}`}
        className="max-w-[400px] max-h-[400px] rounded-lg mt-2 cursor-pointer hover:opacity-90 transition-opacity object-contain"
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
        <AudioMessage
          audioUrl={`${base}${message.mediaUrl}`}
          duration={message.audioDuration}
        />
      </div>
    );
  }
  return null;
}

const MessageMedia = memo(MessageMediaComponent);
export default MessageMedia;
