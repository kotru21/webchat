import { useState, useEffect, useRef } from "react";

const useMessageScroll = ({
  containerRef,
  messageRefs,
  messages,
  currentUser,
}) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const prevMessagesLength = useRef(messages.length);
  const messagesEndRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
    setShowScrollButton(false);
  };

  const scrollToMessage = (messageId) => {
    const element = messageRefs.current[messageId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlight-message");
      setTimeout(() => {
        element.classList.remove("highlight-message");
      }, 2000);
    }
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const isAtBottom =
      container.scrollHeight - (container.scrollTop + container.clientHeight) <=
      100;

    if (isAtBottom) {
      setShowScrollButton(false);
    }
  };

  const checkNewMessagesVisibility = () => {
    const container = containerRef.current;
    if (!container) return;

    const threshold = 100;
    const isNearBottom =
      container.scrollHeight - (container.scrollTop + container.clientHeight) <=
      threshold;

    const hasNewMessagesFromOthers =
      messages.length > prevMessagesLength.current &&
      messages[messages.length - 1]?.sender._id !== currentUser.id;

    if (!isNearBottom && hasNewMessagesFromOthers) {
      setShowScrollButton(true);
    }
  };

  // Эффекты для управления прокруткой
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("auto");
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isAtBottom =
      container.scrollHeight - (container.scrollTop + container.clientHeight) <=
      100;

    if (messages.length > prevMessagesLength.current) {
      if (
        isAtBottom ||
        messages[messages.length - 1]?.sender._id === currentUser.id
      ) {
        scrollToBottom("smooth");
      } else {
        checkNewMessagesVisibility();
      }
    }

    prevMessagesLength.current = messages.length;
  }, [messages, currentUser.id]);

  return {
    showScrollButton,
    scrollToBottom,
    scrollToMessage,
    handleScroll,
  };
};

export default useMessageScroll;
