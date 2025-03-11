import { useRef, useState, useEffect } from "react";

const useMessageScroll = ({ containerRef, messageRefs, currentUserId }) => {
  // Добавляем currentUserId
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const lastMessageTimeRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const initialLoadRef = useRef(true);

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
    // пропкск обработки при начальной загрузке
    if (initialLoadRef.current) {
      return;
    }

    // проверка, что сообщение не от текущего пользователя
    if (!isAtBottom() && message && message.sender._id !== currentUserId) {
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
      if (isAtBottom()) {
        setNewMessagesCount(0);
        isAtBottomRef.current = true;
      } else {
        isAtBottomRef.current = false;
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // сброс флага начальной загрузки после монтирования
  useEffect(() => {
    initialLoadRef.current = false;
    return () => {
      initialLoadRef.current = true;
    };
  }, []);

  return {
    scrollToMessage,
    scrollToBottom,
    handleNewMessage,
    newMessagesCount,
    isAtBottom: () => isAtBottomRef.current,
  };
};

export default useMessageScroll;
