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
      className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-full p-0 ring-1 ring-border/50 transition-[filter,box-shadow] duration-150 hover:brightness-[0.97] hover:ring-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      <AuthorizedMediaImg
        loading="lazy"
        decoding="async"
        src={senderAvatar}
        alt=""
        className="pointer-events-none h-full w-full rounded-full object-cover [transform:translateZ(0)] [backface-visibility:hidden]"
      />
    </button>
  );
});

export default MessageSenderAvatar;
