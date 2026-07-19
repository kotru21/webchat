// Чистая презентация профиля
import { useCallback, useEffect, useState } from "react";
import { FiCopy } from "react-icons/fi";
import { useAuth } from "@context/useAuth";
import { AuthorizedMediaImg } from "@shared/ui/AuthorizedMediaImg";
import { Button } from "@shared/ui/button";
import {
  blockUser,
  listBlocks,
  unblockUser,
} from "@features/profile/api/blocksApi";
import { notify } from "@features/notifications/notify";
import { usePeerE2ee } from "@features/e2ee/model/usePeerE2ee.js";
import { getMyFingerprint } from "@features/e2ee/lib/session.js";
import { formatFingerprint } from "@features/e2ee/lib/formatFingerprint.js";

async function copyText(label, value) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value.replace(/\s+/g, ""));
    notify("success", `${label} скопирован`);
  } catch {
    notify("error", "Не удалось скопировать");
  }
}

function FingerprintRow({ testId, label, value, emphasize }) {
  const display = formatFingerprint(value) || "…";
  return (
    <div
      data-testid={testId}
      className={`flex items-start justify-between gap-2 ${
        emphasize ? "text-destructive" : "text-foreground"
      }`}>
      <div className="min-w-0 flex-1">
        <span className="font-medium">{label}: </span>
        <span className="font-mono text-[13px] leading-5 tracking-wide break-all">
          {display}
        </span>
      </div>
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label={`Копировать: ${label}`}
          onClick={() => copyText(label, value)}>
          <FiCopy size={14} aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}

export function ProfileCard({ profile, onStartChat, isCurrentUser, onClose }) {
  const { user } = useAuth();
  const ownerUserId = user?.id ?? null;
  const peerId = profile?._id || profile?.id;
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [myFpState, setMyFpState] = useState(
    /** @type {{ userId: string | null, fp: string | null }} */ ({
      userId: null,
      fp: null,
    })
  );
  const peerE2ee = usePeerE2ee(isCurrentUser ? null : peerId);

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

  useEffect(() => {
    if (!ownerUserId) return undefined;
    let cancelled = false;
    getMyFingerprint(ownerUserId)
      .then((fp) => {
        if (!cancelled) setMyFpState({ userId: ownerUserId, fp });
      })
      .catch(() => {
        if (!cancelled) setMyFpState({ userId: ownerUserId, fp: null });
      });
    return () => {
      cancelled = true;
    };
  }, [ownerUserId]);

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

  const acceptKey = useCallback(async () => {
    try {
      await peerE2ee.acceptNewKey();
      notify("success", "Новый ключ принят");
    } catch {
      notify("error", "Не удалось принять ключ");
    }
  }, [peerE2ee]);

  if (!profile) return null;

  const myFingerprint =
    (myFpState.userId === ownerUserId ? myFpState.fp : null) ||
    peerE2ee.myFingerprint;


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

        <div className="mt-3 space-y-2 rounded-xl border border-border/50 bg-background/40 p-3 text-sm leading-5">
          <FingerprintRow
            testId="e2ee-my-fingerprint"
            label="Ваш ключ"
            value={myFingerprint}
          />
          {!isCurrentUser && (
            <FingerprintRow
              testId="e2ee-peer-fingerprint"
              label="Ключ собеседника"
              value={
                peerE2ee.peerFingerprint || peerE2ee.pinnedFingerprint || null
              }
            />
          )}
          {peerE2ee.status === "changed" && (
            <div className="space-y-2 border-t border-border/40 pt-2">
              <FingerprintRow
                label="Было"
                value={peerE2ee.pinnedFingerprint}
                emphasize
              />
              <FingerprintRow
                label="Стало"
                value={peerE2ee.peerFingerprint}
                emphasize
              />
            </div>
          )}
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
            {peerE2ee.status === "changed" && (
              <Button
                type="button"
                variant="secondary"
                onClick={acceptKey}
                className="h-10 w-full"
                data-testid="e2ee-trust-new-key">
                Доверять новому ключу
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
