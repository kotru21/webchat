// Чистая презентация профиля
import { useCallback, useEffect, useState } from "react";
import { AuthorizedMediaImg } from "@shared/ui/AuthorizedMediaImg";
import { Button } from "@shared/ui/button";
import {
  blockUser,
  listBlocks,
  unblockUser,
} from "@features/profile/api/blocksApi";
import { notify } from "@features/notifications/notify";

export function ProfileCard({ profile, onStartChat, isCurrentUser, onClose }) {
  const peerId = profile?._id || profile?.id;
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!peerId || isCurrentUser) return undefined;
    let cancelled = false;
    listBlocks()
      .then((users) => {
        if (cancelled) return;
        setBlocked(users.some((u) => u._id === peerId || u.id === peerId));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [peerId, isCurrentUser]);

  const toggleBlock = useCallback(async () => {
    if (!peerId || busy) return;
    setBusy(true);
    try {
      if (blocked) {
        await unblockUser(peerId);
        setBlocked(false);
        notify("success", "Пользователь разблокирован");
      } else {
        await blockUser(peerId);
        setBlocked(true);
        notify("success", "Пользователь заблокирован");
      }
    } catch {
      notify("error", "Не удалось изменить блокировку");
    } finally {
      setBusy(false);
    }
  }, [peerId, busy, blocked]);

  if (!profile) return null;
  return (
    <div className="m3-surface-high w-[320px] overflow-hidden rounded-3xl border border-border/70 shadow-xl backdrop-blur-md">
      <div className="relative h-28 overflow-hidden">
        {profile.banner ? (
          <AuthorizedMediaImg
            src={profile.banner}
            fallback=""
            alt="Обложка профиля"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-primary/80 via-primary to-accent/80" />
        )}
      </div>
      <div className="relative px-4 pb-4">
        <div className="mb-3 flex items-end justify-between -mt-10">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-background bg-muted">
            <AuthorizedMediaImg
              src={profile.avatar}
              className="h-full w-full object-cover"
              alt=""
            />
          </div>
          {onClose ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="mb-1"
              aria-label="Закрыть профиль">
              Закрыть
            </Button>
          ) : null}
        </div>
        <div className="mb-3 text-left">
          <h2 className="truncate text-xl font-bold text-foreground">
            {profile.username || "Пользователь"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isCurrentUser ? profile.email : null}
          </p>
        </div>
        {profile.description && (
          <div className="wrap-break-word whitespace-pre-line text-sm leading-relaxed text-foreground/85">
            {profile.description}
          </div>
        )}

        <div className="mt-3 text-xs text-muted-foreground">
          Зарегистрирован: {new Date(profile.createdAt).toLocaleDateString()}
        </div>

        {!isCurrentUser && (
          <div className="mt-4 flex flex-col gap-2">
            {onStartChat && (
              <Button
                type="button"
                onClick={() => {
                  onStartChat({
                    id: peerId,
                    username: profile.username,
                    avatar: profile.avatar,
                  });
                  onClose && onClose();
                }}
                className="h-10 w-full">
                Написать сообщение
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={toggleBlock}
              className="h-10 w-full">
              {blocked ? "Разблокировать" : "Заблокировать"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileCard;
