import { memo, useEffect, useState } from "react";
import AudioMessage from "@entities/message/ui/AudioMessage";
import { fetchAuthorizedMediaUrl } from "@shared/lib/mediaUrl";

function MessageMediaComponent({ message, onMediaClick }) {
  const [objectUrl, setObjectUrl] = useState("");
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let revoked = false;
    let createdUrl = "";

    if (!message.mediaUrl) return undefined;

    fetchAuthorizedMediaUrl(message.mediaUrl)
      .then((url) => {
        if (revoked) {
          URL.revokeObjectURL(url);
          return;
        }
        createdUrl = url;
        setObjectUrl(url);
        setErrored(false);
      })
      .catch(() => {
        if (!revoked) setErrored(true);
      });

    return () => {
      revoked = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [message.mediaUrl]);

  if (!message.mediaUrl) return null;

  if (message.mediaType === "image") {
    return (
      <img
        src={errored ? undefined : objectUrl || undefined}
        alt={errored ? "Ошибка загрузки" : "Изображение"}
        loading="lazy"
        decoding="async"
        className="mt-2 inline-block cursor-pointer lg:max-w-[400px] lg:max-h-[400px] max-w-[200px] rounded-lg hover:opacity-90 transition-opacity object-contain bg-neutral-200 dark:bg-neutral-700"
        onClick={(e) => {
          e.stopPropagation();
          if (!errored && objectUrl) onMediaClick(objectUrl, "image");
        }}
        onError={() => setErrored(true)}
      />
    );
  }
  if (message.mediaType === "video") {
    return (
      <video
        src={objectUrl || undefined}
        className="max-w-[400px] max-h-[400px] rounded-lg mt-2 cursor-pointer hover:opacity-90 transition-opacity object-contain bg-black/20"
        controls
        onClick={(e) => {
          e.stopPropagation();
          if (objectUrl) onMediaClick(objectUrl, "video");
        }}
      />
    );
  }
  if (message.mediaType === "audio") {
    return (
      <div className="w-full mt-2">
        <AudioMessage audioUrl={objectUrl} duration={message.audioDuration} />
      </div>
    );
  }
  return null;
}

export default memo(MessageMediaComponent);
