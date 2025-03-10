import { useState, useEffect, useRef } from "react";

const useMessageScroll = ({
  containerRef,
  messageRefs,
  messages,
  currentUser,
}) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const prevMessagesLength = useRef(messages.length);
  const shouldScrollToBottom = useRef(true);

  const scrollToBottom = (behavior = "smooth") => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = 0;
    setShowScrollButton(false);
  };

  const scrollToMessage = (messageId) => {
    const element = messageRefs.current[messageId];
    if (!element) return;

    const container = containerRef.current;
    if (!container) return;

    // Вычисляем позицию элемента относительно контейнера
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const scrollOffset =
      elementRect.top - containerRect.top - containerRect.height / 2;

    container.scrollTop += scrollOffset;

    // Добавляем подсветку
    element.classList.add("highlight-message");
    setTimeout(() => {
      element.classList.remove("highlight-message");
    }, 2000);
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    // При flex-col-reverse чем больше scrollTop, тем дальше от последних сообщений
    const threshold = 300;
    const isNearBottom = container.scrollTop < threshold;

    setShowScrollButton(!isNearBottom);
    shouldScrollToBottom.current = container.scrollTop === 0;
  };

  // Автопрокрутка при новых сообщениях
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollTop < 300;
    const hasNewMessages = messages.length > prevMessagesLength.current;
    const isOwnMessage =
      messages[messages.length - 1]?.sender._id === currentUser.id;

    if (hasNewMessages) {
      if (isNearBottom || isOwnMessage || shouldScrollToBottom.current) {
        scrollToBottom("smooth");
      } else {
        setShowScrollButton(true);
      }
    }

    prevMessagesLength.current = messages.length;
  }, [messages, currentUser.id]);

  // Начальная прокрутка при монтировании
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("auto");
    }
  }, []);

  return {
    showScrollButton,
    scrollToBottom,
    scrollToMessage,
    handleScroll,
  };
};

export default useMessageScroll;
