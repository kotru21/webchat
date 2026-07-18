import { AuthorizedMediaImg } from "@shared/ui/AuthorizedMediaImg";

export function MessageSenderAvatar({ sender, senderAvatar }) {
  const displayName = sender?.username || sender?.email || "User";

  return (
    <div className="flex items-center gap-2">
      <AuthorizedMediaImg
        loading="lazy"
        decoding="async"
        src={senderAvatar}
        alt={`${displayName}'s avatar`}
        className="w-8 h-8 rounded-full object-cover shrink-0"
      />
    </div>
  );
}

export default MessageSenderAvatar;
