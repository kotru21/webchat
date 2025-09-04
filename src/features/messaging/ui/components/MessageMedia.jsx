import AudioMessage from "../../../../components/Chat/AudioMessage";

export default function MessageMedia({ message, onMediaClick }) {
  if (message.isDeleted || !message.mediaUrl) return null;
  const base = import.meta.env.VITE_API_URL;
  if (message.mediaType === "image") {
    return (
      <img
        src={`${base}${message.mediaUrl}`}
        alt="Изображение"
        className="lg:max-w-[400px] lg:max-h-[400px] max-w-[200px] rounded-lg mt-2 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onMediaClick(message.mediaUrl, "image");
        }}
      />
    );
  }
  if (message.mediaType === "video") {
    return (
      <video
        src={`${base}${message.mediaUrl}`}
        className="max-w-[400px] max-h-[400px] rounded-lg mt-2 cursor-pointer hover:opacity-90 transition-opacity"
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
