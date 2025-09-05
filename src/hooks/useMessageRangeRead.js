import { useRef, useCallback } from "react";

// Хук использует callbacks Virtuoso (rangeChanged) вместо IntersectionObserver
// чтобы батчить отметку прочитанных сообщений и снизить дерганье.
export function useMessageRangeRead({ flatItems, onMarkAsRead }) {
  // flatItems: массив элементов вида { type: 'day'|'message', message?, day? }
  const readSetRef = useRef(new Set());

  const handleRangeChanged = useCallback(
    (range) => {
      const { startIndex, endIndex } = range;
      for (let i = startIndex; i <= endIndex; i++) {
        const item = flatItems[i];
        if (!item || item.type !== "message") continue;
        const msg = item.message;
        if (!msg || msg.isDeleted) continue;
        // не повторяем запросы
        if (readSetRef.current.has(msg._id)) continue;
        readSetRef.current.add(msg._id);
        onMarkAsRead(msg);
      }
    },
    [flatItems, onMarkAsRead]
  );

  return { handleRangeChanged };
}

export default useMessageRangeRead;
