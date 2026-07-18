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
    const openImage = () => {
      if (!errored && objectUrl) onMediaClick(objectUrl, "image");
    };

    return (
      <button
        type="button"
        className="mt-2 inline-block max-w-[200px] cursor-pointer rounded-lg bg-neutral-200 object-contain transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 dark:bg-neutral-700 lg:max-h-[400px] lg:max-w-[400px]"
        onClick={(e) => {
          e.stopPropagation();
          openImage();
        }}
        disabled={errored || !objectUrl}
        aria-label={
          errored ? "Изображение не загрузилось" : "Открыть изображение"
        }>
        <img
          src={errored ? undefined : objectUrl || undefined}
          alt={errored ? "Ошибка загрузки" : ""}
          loading="lazy"
          decoding="async"
          className="max-h-[400px] max-w-full rounded-lg object-contain"
          onError={() => setErrored(true)}
        />
      </button>
    );
  }
  if (message.mediaType === "video") {
    return (
      <video
        src={objectUrl || undefined}
        className="mt-2 max-h-[400px] max-w-[400px] cursor-pointer rounded-lg bg-black/20 object-contain transition-opacity hover:opacity-90"
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
      <div className="mt-2 w-full">
        <AudioMessage audioUrl={objectUrl} duration={message.audioDuration} />
      </div>
    );
  }
  return null;
}

export default memo(MessageMediaComponent);
