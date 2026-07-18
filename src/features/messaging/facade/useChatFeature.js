import { useMemo, useEffect } from "react";
import { useChatMessages } from "./useChatMessages";
import { useSendMessage } from "@features/sendMessage";
import useChatSocket from "./useChatSocket";
import { useAuth } from "@context/useAuth";
import { useChatStore } from "@shared/store/chatStore";
import { resolvePeerId } from "@shared/lib/peerId";

export function useChatFeature({ onError } = {}) {
  const selectedUser = useChatStore((s) => s.selectedUser);
  const peerId = resolvePeerId(selectedUser);
  const { user } = useAuth();
  const incrementUnread = useChatStore((s) => s.incrementUnread);
  const resetUnread = useChatStore((s) => s.resetUnread);

  const {
    messages,
    loading: messagesLoading,
    error,
    setError,
  } = useChatMessages(selectedUser);

  const { send, loading: sending } = useSendMessage({
    receiverId: peerId,
  });

  useChatSocket({ user, selectedUser, incrementUnread });

  useEffect(() => {
    if (error && onError) {
      onError(error);
      setError("");
    }
  }, [error, onError, setError]);

  const api = useMemo(() => ({ send }), [send]);

  return {
    messages,
    loading: messagesLoading || sending,
    api,
    incrementUnread,
    resetUnread,
  };
}

export default useChatFeature;
