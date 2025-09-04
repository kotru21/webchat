import { useRef, useState, useEffect } from "react";

const useMessageScroll = ({
  containerRef,
  messageRefs,
  currentUserId,
  isTransitioning,
}) => {
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const lastMessageTimeRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const initialLoadRef = useRef(true);
  const lastViewedMessageRef = useRef(null);

  // Сбрасываем счетчик новых сообщений при переходе между чатами
  useEffect(() => {
    if (isTransitioning) {
      setNewMessagesCount(0);
    }
  }, [isTransitioning]);

  const isAtBottom = () => {
    const container = containerRef.current;
    if (!container) return true;

    const threshold = 100;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      threshold
    );
  };

  const scrollToBottom = (smooth = true) => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
    setNewMessagesCount(0);
    isAtBottomRef.current = true;
    // Обновляем последнее просмотренное сообщение
    const messages = Array.from(container.querySelectorAll(".message-item"));
    if (messages.length > 0) {
      const lastMessageId =
        messages[messages.length - 1].getAttribute("data-message-id");
      lastViewedMessageRef.current = lastMessageId;
    }
  };

  const scrollToMessage = (messageId) => {
    const element = messageRefs.current[messageId];
    if (!element) return;

    const container = containerRef.current;
    if (!container) return;

    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const scrollOffset =
      elementRect.top - containerRect.top - containerRect.height / 2;

    container.scrollTop += scrollOffset;

    element.classList.add("highlight-message");
    setTimeout(() => {
      element.classList.remove("highlight-message");
    }, 2000);
  };

  const handleNewMessage = (message) => {
    if (!message || isTransitioning) return; // Игнорируем новые сообщения во время анимации

    // Игнорируем сообщения от текущего пользователя
    if (message.sender._id === currentUserId) {
      lastViewedMessageRef.current = message._id;
      return;
    }

    // Проверяем, видел ли пользователь это сообщение
    if (!isAtBottom() && message._id !== lastViewedMessageRef.current) {
      const currentTime = new Date().getTime();
      const lastTime = lastMessageTimeRef.current;

      if (!lastTime || currentTime - lastTime > 1000) {
        setNewMessagesCount((prev) => prev + 1);
      }
      lastMessageTimeRef.current = currentTime;
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isTransitioning) return;
      // инлайн проверка низа без зависимости на функцию isAtBottom
      const atBottom = (() => {
        const threshold = 100;
        return (
          container.scrollHeight -
            container.scrollTop -
            container.clientHeight <=
          threshold
        );
      })();

      if (atBottom) {
        setNewMessagesCount(0);
        isAtBottomRef.current = true;
        const messages = Array.from(
          container.querySelectorAll(".message-item")
        );
        if (messages.length > 0) {
          const lastMessageId =
            messages[messages.length - 1].getAttribute("data-message-id");
          lastViewedMessageRef.current = lastMessageId;
        }
      } else {
        isAtBottomRef.current = false;
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isTransitioning, containerRef]);

  // при первой загрузке устанавливаем последнее просмотренное сообщение
  useEffect(() => {
    const container = containerRef.current;
    if (container && initialLoadRef.current) {
      const messages = Array.from(container.querySelectorAll(".message-item"));
      if (messages.length > 0) {
        const lastMessageId =
          messages[messages.length - 1].getAttribute("data-message-id");
        lastViewedMessageRef.current = lastMessageId;
        initialLoadRef.current = false;
      }
    }
  }, [containerRef]);

  return {
    scrollToMessage,
    scrollToBottom,
    handleNewMessage,
    newMessagesCount,
    isAtBottom: () => isAtBottomRef.current,
  };
};

export default useMessageScroll;
