export function MessageSenderAvatar({
  sender,
  senderAvatar,
  isOwnMessage,
  profileTriggerRef,
  isProfileOpen,
  onProfileClick,
  onCloseProfile,
  ProfileWidgetComponent,
  currentUserId,
  onStartChat,
}) {
  const displayName = sender?.username || sender?.email || "User";

  return (
    <div className="cursor-pointer flex items-center gap-2">
      <div
        ref={profileTriggerRef}
        onClick={onProfileClick}
        className="relative">
        <img
          loading="lazy"
          decoding="async"
          src={senderAvatar}
          alt={`${displayName}'s avatar`}
          className="w-8 h-8 rounded-full object-cover shrink-0 hover:opacity-80 transition-opacity"
          onError={(event) => {
            if (event.currentTarget.src.endsWith("/default-avatar.png")) {
              return;
            }

            event.currentTarget.src = "/default-avatar.png";
          }}
        />
        {isProfileOpen && (
          <div className="absolute top-0">
            {ProfileWidgetComponent ? (
              <ProfileWidgetComponent
                userId={sender?._id}
                onClose={onCloseProfile}
                anchorRef={profileTriggerRef}
                isReversed={isOwnMessage}
                containerClassName={
                  isOwnMessage
                    ? "right-full translate-x-[-8px]"
                    : "left-full translate-x-[8px]"
                }
                currentUserId={currentUserId}
                onStartChat={onStartChat}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageSenderAvatar;
