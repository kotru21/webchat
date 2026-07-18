import { useEffect } from "react";
import { useUserChats } from "@features/chats/api/useUserChats";
import { useChatStore } from "@shared/store/chatStore";
import { resolvePeerId } from "@shared/lib/peerId";

const EMPTY_CHATS = Object.freeze([]);

function toSelectedUser(chat) {
  const peerId = resolvePeerId(chat?.user);
  if (!peerId) return null;

  return {
    id: peerId,
    username: chat.user.username,
    avatar: chat.user.avatar,
  };
}

/**
 * When the chats list arrives and nothing is selected, pick the most recent peer.
 * Does not override an existing selection (in-memory Zustand selectedUser).
 * Call from a single mount point (Chat page) to avoid duplicate selection effects.
 */
export function useEnsureChatSelection() {
  const selectedUser = useChatStore((s) => s.selectedUser);
  const setSelectedUser = useChatStore((s) => s.setSelectedUser);
  const resetUnread = useChatStore((s) => s.resetUnread);
  const selectedPeerId = resolvePeerId(selectedUser);
  const { data, isLoading, error } = useUserChats();
  const chats = data ?? EMPTY_CHATS;
  const firstChat = chats[0];
  const firstPeerId = resolvePeerId(firstChat?.user);

  useEffect(() => {
    // Guard: only select when nothing is selected and a peer exists.
    // Once selectedPeerId is set, later refetches no-op — no reselect loop.
    if (selectedPeerId || isLoading || !firstPeerId) return;

    const next = toSelectedUser(firstChat);
    if (!next) return;

    setSelectedUser(next);
    resetUnread(next.id);
  }, [
    selectedPeerId,
    isLoading,
    firstPeerId,
    firstChat,
    setSelectedUser,
    resetUnread,
  ]);

  return {
    chats,
    isLoading,
    error,
    selectedPeerId,
    hasPeers: chats.length > 0,
    isEmpty: !isLoading && !error && chats.length === 0,
  };
}

export default useEnsureChatSelection;
