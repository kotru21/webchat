import { useMemo } from "react";
import { formatMessageDay } from "@shared/lib/date";

// Хук для группировки и подготовки плоского массива элементов для виртуализации
// Возвращает: groupedByDay [[day, messages[]]...], flatItems (массив объектов с type), pinnedMessages
export function useMessageGrouping(messages, { largeDayThreshold = 60 } = {}) {
  // Группировка по дню
  const groupedByDay = useMemo(() => {
    const map = new Map();
    for (const m of messages) {
      const dayKey = formatMessageDay(m.createdAt);
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey).push(m);
    }
    return Array.from(map.entries());
  }, [messages]);

  // Плоские элементы: day / hour / message
  const flatItems = useMemo(() => {
    const result = [];
    for (const [day, msgs] of groupedByDay) {
      result.push({ type: "day", day });
      if (msgs.length > largeDayThreshold) {
        const hourMap = new Map();
        for (const m of msgs) {
          const d = new Date(m.createdAt);
          const hour = String(d.getHours()).padStart(2, "0");
          if (!hourMap.has(hour)) hourMap.set(hour, []);
          hourMap.get(hour).push(m);
        }
        for (const [hour, hourMsgs] of hourMap) {
          result.push({ type: "hour", day, hour });
          for (const hm of hourMsgs)
            result.push({ type: "message", message: hm, hour, day });
        }
      } else {
        for (const m of msgs) result.push({ type: "message", message: m, day });
      }
    }
    return result;
  }, [groupedByDay, largeDayThreshold]);

  const pinnedMessages = useMemo(
    () => messages.filter((m) => m.isPinned),
    [messages]
  );

  return { groupedByDay, flatItems, pinnedMessages };
}
