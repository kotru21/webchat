import { forwardRef } from "react";
import { AuthorizedMediaImg } from "@shared/ui/AuthorizedMediaImg";

export const MessageSenderAvatar = forwardRef(function MessageSenderAvatar(
  { sender, senderAvatar, onClick },
  ref
) {
  const displayName = sender?.username || sender?.email || "Пользователь";

  return (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      data-profile-anchor
      aria-label={`Открыть профиль: ${displayName}`}
      className="shrink-0 cursor-pointer rounded-full p-0 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      <AuthorizedMediaImg
        loading="lazy"
        decoding="async"
        src={senderAvatar}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    </button>
  );
});

export default MessageSenderAvatar;
