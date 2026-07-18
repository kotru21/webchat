import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "@shared/store/chatStore";
import { useMessagesStore } from "@shared/store/messagesStore";
import { resolvePeerId } from "@shared/lib/peerId";
import useMessageScroll from "../../../hooks/useMessageScroll";
import { useMessageGrouping } from "@entities/message/lib/useMessageGrouping";

export function useMessagesListController({ messages, currentUser }) {
  const selectedUser = useChatStore((s) => s.selectedUser);
  const selectedPeerId = resolvePeerId(selectedUser);
  const saveChatView = useMessagesStore((s) => s.saveChatView);
  const getChatView = useMessagesStore((s) => s.getChatView);

  const listRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const indexByMessageIdRef = useRef(new Map());

  const {
    scrollToMessage,
    scrollToBottom,
    newMessagesCount,
    setAtBottomState,
  } = useMessageScroll({
    listRef,
    scrollContainerRef,
    indexByMessageIdRef,
    currentUserId: currentUser.id,
    isTransitioning: false,
  });

  const { flatItems } = useMessageGrouping(messages);

  const initialScrolledRef = useRef(false);
  const restoringRef = useRef(false);
  const lastMessagesCountRef = useRef(0);
  const userInteractedRef = useRef(false);
  const prevSelectedIdRef = useRef(selectedPeerId);

  useEffect(() => {
    const outer = scrollContainerRef.current;
    if (!outer) return;
    const onUserScroll = () => {
      const atBottom =
        outer.scrollHeight - outer.scrollTop - outer.clientHeight < 8;
      if (!atBottom) userInteractedRef.current = true;
    };
    outer.addEventListener("scroll", onUserScroll, { passive: true });
    return () => outer.removeEventListener("scroll", onUserScroll);
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    if (initialScrolledRef.current) return;
    const view = getChatView(selectedPeerId);
    restoringRef.current = true;
    const outer = scrollContainerRef.current;
    if (!outer) return;

    if (!view) {
      scrollToBottom(false);
      initialScrolledRef.current = true;
      restoringRef.current = false;
      return;
    }
    if (view.atBottom) {
      scrollToBottom(false);
    } else if (view.anchorId) {
      scrollToMessage(view.anchorId, false);
    } else if (typeof view.scrollTop === "number") {
      outer.scrollTop = view.scrollTop;
    }
    initialScrolledRef.current = true;
    restoringRef.current = false;
  }, [
    getChatView,
    messages.length,
    scrollToBottom,
    scrollToMessage,
    selectedPeerId,
  ]);

  useEffect(() => {
    const prevId = prevSelectedIdRef.current;
    const nextId = selectedPeerId;
    if (prevId !== nextId) {
      initialScrolledRef.current = false;
      userInteractedRef.current = false;
      lastMessagesCountRef.current = 0;
      prevSelectedIdRef.current = nextId;
    }
  }, [selectedPeerId]);

  useEffect(() => {
    if (!initialScrolledRef.current) return;
    if (restoringRef.current) return;
    if (messages.length > lastMessagesCountRef.current) {
      const outer = scrollContainerRef.current;
      if (outer) {
        const atBottom =
          outer.scrollHeight - outer.scrollTop - outer.clientHeight < 8;
        if (atBottom || !userInteractedRef.current) {
          scrollToBottom(true);
        }
      }
    }
    lastMessagesCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    const outer = scrollContainerRef.current;
    if (!outer) return;
    let raf = null;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const atBottom =
          outer.scrollHeight - outer.scrollTop - outer.clientHeight < 8;
        if (!restoringRef.current && initialScrolledRef.current) {
          const visible = outer.querySelector(".message-item[data-message-id]");
          const anchorId = visible?.getAttribute("data-message-id") || null;
          saveChatView(selectedPeerId, {
            scrollTop: outer.scrollTop,
            anchorId,
            atBottom,
          });
        }
      });
    };
    outer.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      outer.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [saveChatView, selectedPeerId]);

  const onItemsRange = useCallback(() => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
      setAtBottomState(atBottom);
    }
  }, [setAtBottomState]);

  return {
    flatItems,
    newMessagesCount,
    listRef,
    scrollContainerRef,
    indexByMessageIdRef,
    scrollToMessage,
    scrollToBottom,
    onItemsRange,
  };
}

export default useMessagesListController;
