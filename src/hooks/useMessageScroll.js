import { useRef, useState, useEffect, useCallback } from "react";

// Версия хука адаптирована под react-window.
// Ожидается ref listRef на экземпляр FixedSizeList/VariableSizeList (react-window)
// Мы полагаемся на методы scrollTo / scrollToItem (если доступны) и DOM для вычисления состояния "у дна".
// indexByMessageIdRef наполняется снаружи аналогично прежней реализации.

const useMessageScroll = ({
  listRef, // ref, полученный из <List ref={listRef} /> (react-window)
  scrollContainerRef, // ref на внешний div со скроллом (outerElement)
  indexByMessageIdRef,
  currentUserId,
  isTransitioning,
}) => {
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const lastMessageTimeRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const initialLoadRef = useRef(true);
  const lastViewedMessageRef = useRef(null);

  // helper вычисления состояния "у дна"
  const recomputeIsAtBottom = useCallback(() => {
    const el = scrollContainerRef?.current;
    if (!el) return;
    const threshold = 16; // px
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    if (atBottom !== isAtBottomRef.current) {
      isAtBottomRef.current = atBottom;
      if (atBottom) setNewMessagesCount(0);
    }
  }, [scrollContainerRef]);

  // Сброс при переходах
  useEffect(() => {
    if (isTransitioning) setNewMessagesCount(0);
  }, [isTransitioning]);

  const scrollToBottom = useCallback(
    (smooth = true) => {
      const list = listRef.current;
      const outer = scrollContainerRef?.current;
      if (!list || !outer) return;
      const behavior = smooth ? "smooth" : "auto";
      // react-window не всегда даёт простой API для скролла в конец, используем scrollHeight
      outer.scrollTo({ top: outer.scrollHeight, behavior });
      setNewMessagesCount(0);
      isAtBottomRef.current = true;
    },
    [listRef, scrollContainerRef]
  );

  const scrollToMessage = useCallback(
    (messageId) => {
      if (!messageId) return;
      const list = listRef.current;
      const outer = scrollContainerRef?.current;
      if (!list || !outer) return;
      const map = indexByMessageIdRef.current;
      const index = map.get(messageId);
      if (index == null) return;
      // scrollToItem доступен у Variable/FixedSizeList
      if (typeof list.scrollToItem === "function") {
        try {
          list.scrollToItem(index, "center");
        } catch {
          // ignore scroll errors
        }
      } else if (typeof list.scrollTo === "function") {
        // fallback: приблизительное вычисление высоты (может быть неточно без измерения).
        // Пользователь может заменить на VariableSizeList и supply itemSizeMap.
        const approxSize = 72; // эвристика
        list.scrollTo(index * approxSize);
      }
      // подсветка
      const highlight = (attempt = 0) => {
        if (attempt > 10) return;
        const el = outer.querySelector(
          `[data-message-id="${CSS.escape(messageId)}"]`
        );
        if (el) {
          el.classList.add("highlight-message");
          setTimeout(() => el.classList.remove("highlight-message"), 2000);
          return;
        }
        setTimeout(() => highlight(attempt + 1), 60);
      };
      highlight();
    },
    [listRef, scrollContainerRef, indexByMessageIdRef]
  );

  const handleNewMessage = useCallback(
    (message) => {
      if (!message || isTransitioning) return;
      if (message.sender._id === currentUserId) {
        lastViewedMessageRef.current = message._id;
        return;
      }
      if (
        !isAtBottomRef.current &&
        message._id !== lastViewedMessageRef.current
      ) {
        const now = Date.now();
        const last = lastMessageTimeRef.current;
        if (!last || now - last > 1000) {
          setNewMessagesCount((c) => c + 1);
        }
        lastMessageTimeRef.current = now;
      }
    },
    [currentUserId, isTransitioning]
  );

  // Первичная прокрутка в самый низ без двойного RAF
  useEffect(() => {
    if (initialLoadRef.current && listRef.current) {
      initialLoadRef.current = false;
      scrollToBottom(false);
    }
  }, [scrollToBottom, listRef]);

  // слушаем скролл контейнера
  useEffect(() => {
    const el = scrollContainerRef?.current;
    if (!el) return;
    const handler = () => recomputeIsAtBottom();
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [scrollContainerRef, recomputeIsAtBottom]);

  return {
    scrollToMessage,
    scrollToBottom,
    handleNewMessage,
    newMessagesCount,
    isAtBottom: () => isAtBottomRef.current,
    setAtBottomState: (val) => {
      if (val) setNewMessagesCount(0);
      isAtBottomRef.current = val;
    },
  };
};

export default useMessageScroll;
