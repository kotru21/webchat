import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "@shared/store/chatStore";
import { useMessagesStore } from "@features/messaging/store/messagesStore";
import useMessageScroll from "../../../hooks/useMessageScroll";
import useMessageRangeRead from "../../../hooks/useMessageRangeRead";
import { useMessageGrouping } from "@entities/message/lib/useMessageGrouping";

export function useMessagesListController({
  messages,
  currentUser,
  onMarkAsRead,
}) {
  const selectedUser = useChatStore((s) => s.selectedUser);
  const saveChatView = useMessagesStore((s) => s.saveChatView);
  const getChatView = useMessagesStore((s) => s.getChatView);

  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
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

  const { flatItems, pinnedMessages } = useMessageGrouping(messages);
  const { handleRangeChanged } = useMessageRangeRead({
    flatItems,
    onMarkAsRead,
  });

  const initialScrolledRef = useRef(false);
  const restoringRef = useRef(false);
  const anchorAppliedRef = useRef(false); // для визуальной подсветки
  const pendingAnchorRef = useRef(null); // { id, startedAt }
  const lastMessagesCountRef = useRef(0);
  const userInteractedRef = useRef(false);
  // фикс: хранить id чата для корректного сохранения состояния при переключении
  const prevSelectedIdRef = useRef(selectedUser?.id || null);

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
    if (initialScrolledRef.current) return; // уже восстановили
    const view = getChatView(selectedUser?.id || null);
    restoringRef.current = true;
    const outer = scrollContainerRef.current;
    if (!outer) return;

    // нет сохранённого вида — просто вниз
    if (!view) {
      scrollToBottom(false);
      initialScrolledRef.current = true;
      restoringRef.current = false;
      return;
    }
    // нужно быть внизу
    if (view.atBottom) {
      scrollToBottom(false);
      initialScrolledRef.current = true;
      restoringRef.current = false;
      return;
    }
    // есть anchor — пробуем сразу, иначе ждём появления
    if (view.anchorId) {
      const el = outer.querySelector(
        `[data-message-id="${CSS.escape(view.anchorId)}"]`
      );
      if (el) {
        const top = el.offsetTop - Math.max(outer.clientHeight * 0.25, 64);
        outer.scrollTo({ top: top < 0 ? 0 : top, behavior: "auto" });
        anchorAppliedRef.current = true;
        el.classList.add("anchor-highlight");
        setTimeout(() => el.classList.remove("anchor-highlight"), 1600);
        initialScrolledRef.current = true;
        restoringRef.current = false;
      } else {
        pendingAnchorRef.current = { id: view.anchorId, startedAt: Date.now(), fallbackTop: view.scrollTop || 0 };
      }
      return;
    }
    // fallback к сохранённому scrollTop
    outer.scrollTo({ top: view.scrollTop || 0, behavior: "auto" });
    initialScrolledRef.current = true;
    restoringRef.current = false;
  }, [messages.length, scrollToBottom, getChatView, selectedUser?.id]);

  // Отложенная попытка привязки к anchor, если он ещё не в DOM
  useEffect(() => {
    const pending = pendingAnchorRef.current;
    if (!pending) return;
    if (initialScrolledRef.current) return; // уже восстановили
    const outer = scrollContainerRef.current;
    if (!outer) return;
    const el = outer.querySelector(
      `[data-message-id="${CSS.escape(pending.id)}"]`
    );
    if (el) {
      const top = el.offsetTop - Math.max(outer.clientHeight * 0.25, 64);
      outer.scrollTo({ top: top < 0 ? 0 : top, behavior: "auto" });
      anchorAppliedRef.current = true;
      el.classList.add("anchor-highlight");
      setTimeout(() => el.classList.remove("anchor-highlight"), 1600);
      initialScrolledRef.current = true;
      restoringRef.current = false;
      pendingAnchorRef.current = null;
      return;
    }
    // истёк таймаут ожидания — fallback
    if (Date.now() - pending.startedAt > 1500) {
      outer.scrollTo({ top: pending.fallbackTop, behavior: "auto" });
      initialScrolledRef.current = true;
      restoringRef.current = false;
      pendingAnchorRef.current = null;
    }
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > lastMessagesCountRef.current) {
      const outer = scrollContainerRef.current;
      const atBottom = outer
        ? outer.scrollHeight - outer.scrollTop - outer.clientHeight < 32
        : true;
      const shouldStick =
        !userInteractedRef.current || atBottom || !initialScrolledRef.current;
      if (shouldStick) {
        Promise.resolve().then(() =>
          requestAnimationFrame(() => scrollToBottom(false))
        );
      }
      lastMessagesCountRef.current = messages.length;
    }
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    // при смене чата начинаем фазу восстановления
    initialScrolledRef.current = false;
    anchorAppliedRef.current = false;
    restoringRef.current = true;
  }, [selectedUser?.id]);

  useEffect(() => {
    const outer = scrollContainerRef.current;
    const currentId = selectedUser?.id || null;
    return () => {
      // используем currentId из момента подписки (а не новое selectedUser?.id)
      if (!outer) return;
      const atBottom =
        outer.scrollHeight - outer.scrollTop - outer.clientHeight < 8;
      const centerEl = outer.querySelector(".message-item[data-message-id]");
      const anchorId = centerEl?.getAttribute("data-message-id") || null;
      saveChatView(currentId, {
        scrollTop: outer.scrollTop,
        anchorId,
        atBottom,
      });
      prevSelectedIdRef.current = currentId;
    };
  }, [saveChatView, selectedUser?.id]);

  useEffect(() => {
    const outer = scrollContainerRef.current;
    if (!outer) return;
    let raf = null;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const atBottom =
          outer.scrollHeight - outer.scrollTop - outer.clientHeight < 8;
        // не сохраняем промежуточные положения пока восстанавливаем предыдущий вид
        if (!restoringRef.current && initialScrolledRef.current) {
          const visible = outer.querySelector(".message-item[data-message-id]");
          const anchorId = visible?.getAttribute("data-message-id") || null;
          saveChatView(selectedUser?.id || null, {
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
  }, [saveChatView, selectedUser?.id]);

  const onItemsRange = useCallback(
    ({ startIndex, endIndex }) => {
      handleRangeChanged({ startIndex, endIndex });
      if (scrollContainerRef.current) {
        const el = scrollContainerRef.current;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
        setAtBottomState(atBottom);
      }
    },
    [handleRangeChanged, setAtBottomState]
  );

  return {
    flatItems,
    pinnedMessages,
    newMessagesCount,
    listRef,
    scrollContainerRef,
    indexByMessageIdRef,
    activeMessageMenu,
    setActiveMessageMenu,
    scrollToMessage,
    scrollToBottom,
    onItemsRange,
  };
}

export default useMessagesListController;
