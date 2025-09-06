import { useState, useEffect, useCallback } from "react";

export function useReadStatus({ message, currentUserId }) {
  const [showReaders, setShowReaders] = useState(false);
  const [readers, setReaders] = useState([]);

  useEffect(() => {
    if (Array.isArray(message.readBy)) {
      setReaders(message.readBy.filter((r) => r._id !== message.sender._id));
    } else {
      setReaders([]);
    }
  }, [message]);

  const shouldRender = message.sender._id === currentUserId;

  const toggleTooltip = useCallback(
    (visible) => () => setShowReaders(visible),
    []
  );

  // Возвращаем структурированные данные для UI-компонента вместо JSX
  const markState = {
    shouldRender,
    isEmpty: !Array.isArray(readers) || readers.length === 0,
    readers,
    showReaders,
    events: {
      onMouseEnter: toggleTooltip(true),
      onMouseLeave: toggleTooltip(false),
    },
  };

  return { markState };
}

export default useReadStatus;
