import { memo, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { VariableSizeList as List } from "react-window";
import { formatMessageDay } from "@shared/lib/date";
import { MessageItem } from "./MessageItem";
import NewMessagesButton from "./NewMessagesButton";
import useMessageScroll from "../../../hooks/useMessageScroll";
import useMessageRangeRead from "../../../hooks/useMessageRangeRead";

export const MessagesList = memo(function MessagesList({
  messages,
  currentUser,
  onMarkAsRead,
  onEditMessage,
  onDeleteMessage,
  onMediaClick,
  onPinMessage,
  onStartChat,
  enablePinnedPanel = true,
}) {
  // Константы вертикальных интервалов (px)
  const GAP_MESSAGE = 32; // эквивалент mb-8 (2rem)
  const GAP_DAY = 24; // примерно mb-6
  const GAP_HOUR = 16; // примерно mb-4
  const [showAllPinned, setShowAllPinned] = useState(false);
  // ref на экземпляр списка react-window
  const listRef = useRef(null);
  // ref на scroll контейнер (outerElement) для вычисления дна
  const scrollContainerRef = useRef(null);
  // карта индексов для быстрого scrollToMessage
  const indexByMessageIdRef = useRef(new Map());
  const messageRefs = useRef({});
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);

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

  // Группировка по дням
  const grouped = useMemo(() => {
    const map = new Map();
    for (const m of messages) {
      const dayKey = formatMessageDay(m.createdAt);
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey).push(m);
    }
    return Array.from(map.entries());
  }, [messages]);

  // Порог большого дня
  const LARGE_DAY_THRESHOLD = 60;

  // Подготовим плоский массив: day -> (hour?) -> messages
  const flatItems = useMemo(() => {
    const result = [];
    for (const [day, msgs] of grouped) {
      result.push({ type: "day", day });
      if (msgs.length > LARGE_DAY_THRESHOLD) {
        // группируем по часу
        const hourMap = new Map();
        for (const m of msgs) {
          const d = new Date(m.createdAt);
          // zero pad hour
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
  }, [grouped]);

  const { handleRangeChanged } = useMessageRangeRead({
    flatItems,
    onMarkAsRead,
  });

  const pinnedMessages = useMemo(
    () => messages.filter((m) => m.isPinned),
    [messages]
  );

  const initialScrolledRef = useRef(false);
  useEffect(() => {
    if (!initialScrolledRef.current && messages.length > 0) {
      scrollToBottom(false);
      initialScrolledRef.current = true;
    }
  }, [messages.length, scrollToBottom]);

  // grouped уже объявлен выше

  // data массив для react-window
  const dataItems = flatItems;

  // Заполняем карту индексов (messageId -> index) для виртуализации
  useEffect(() => {
    const map = indexByMessageIdRef.current;
    map.clear();
    flatItems.forEach((item, idx) => {
      if (item.type === "message") {
        const id = item.message._id || item.message.id || item.message.tempId;
        if (id) map.set(id, idx);
      }
    });
  }, [flatItems]);

  // измерение высот элементов для VariableSizeList
  const sizeMapRef = useRef(new Map());
  const [containerHeight, setContainerHeight] = useState(0);
  const listContainerRef = useRef(null);
  const pendingResetIndexRef = useRef(null);
  const rafIdRef = useRef(null);

  // измеряем высоту контейнера
  useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.clientHeight;
      if (h !== containerHeight) setContainerHeight(h || 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [containerHeight]);
  const getSize = useCallback(
    (index) => sizeMapRef.current.get(index) || 80, // fallback средняя высота
    []
  );

  const scheduleReset = useCallback(() => {
    if (rafIdRef.current != null) return; // уже запланировано
    rafIdRef.current = requestAnimationFrame(() => {
      if (
        pendingResetIndexRef.current != null &&
        listRef.current?.resetAfterIndex
      ) {
        listRef.current.resetAfterIndex(pendingResetIndexRef.current);
      }
      pendingResetIndexRef.current = null;
      rafIdRef.current = null;
    });
  }, []);

  const setSize = useCallback(
    (index, size) => {
      const prev = sizeMapRef.current.get(index);
      if (prev !== size) {
        sizeMapRef.current.set(index, size);
        if (pendingResetIndexRef.current == null) {
          pendingResetIndexRef.current = index;
        } else {
          pendingResetIndexRef.current = Math.min(
            pendingResetIndexRef.current,
            index
          );
        }
        scheduleReset();
      }
    },
    [scheduleReset]
  );

  const ItemRow = ({ index, style }) => {
    const item = dataItems[index];
    // динамически пересчитаем высоту через ref
    const refCb = (el) => {
      if (el) {
        const h = el.getBoundingClientRect().height;
        setSize(index, h);
      }
    };
    if (!item) return null;
    if (item.type === "day") {
      return (
        <div
          style={{ ...style }}
          ref={(el) => {
            if (el) {
              const base =
                el.firstChild?.getBoundingClientRect().height ||
                el.getBoundingClientRect().height;
              const stored = Number(el.dataset.measuredHeight || 0);
              if (stored !== base) {
                el.dataset.measuredHeight = String(base);
                setSize(index, base + GAP_DAY);
              }
            }
          }}
          className="relative">
          <div
            className="flex justify-center my-2"
            style={{ paddingBottom: GAP_DAY }}>
            <span className="px-4 py-1 text-xs font-medium bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full shadow-sm select-none backdrop-blur-sm bg-opacity-70 dark:bg-opacity-50">
              {item.day}
            </span>
          </div>
        </div>
      );
    }
    if (item.type === "hour") {
      return (
        <div
          style={{ ...style }}
          ref={(el) => {
            if (el) {
              const base =
                el.firstChild?.getBoundingClientRect().height ||
                el.getBoundingClientRect().height;
              const stored = Number(el.dataset.measuredHeight || 0);
              if (stored !== base) {
                el.dataset.measuredHeight = String(base);
                setSize(index, base + GAP_HOUR);
              }
            }
          }}
          className="w-full flex justify-center mt-2">
          <span
            className="text-[10px] tracking-wider uppercase text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full"
            style={{ paddingBottom: GAP_HOUR }}>
            {item.hour}:00
          </span>
        </div>
      );
    }
    const message = item.message;
    const mid = message._id || message.id || message.tempId;
    return (
      <div
        style={{ ...style }}
        ref={(el) => {
          if (el) {
            messageRefs.current[mid] = el;
            const inner = el.firstChild;
            const base =
              inner?.getBoundingClientRect().height ||
              el.getBoundingClientRect().height;
            const stored = Number(el.dataset.measuredHeight || 0);
            if (stored !== base) {
              el.dataset.measuredHeight = String(base);
              setSize(index, base + GAP_MESSAGE);
            }
          }
        }}
        data-message-id={mid}
        className="message-item px-4 md:px-12 lg:px-20 xl:px-24 xl:pr-40">
        <div style={{ paddingBottom: GAP_MESSAGE }}>
          <MessageItem
            message={message}
            currentUser={currentUser}
            onDelete={() => onDeleteMessage(message._id || message.id)}
            onMediaClick={onMediaClick}
            onPin={onPinMessage}
            isMenuOpen={activeMessageMenu === (message._id || message.id)}
            onToggleMenu={() => {
              setActiveMessageMenu(
                activeMessageMenu === (message._id || message.id)
                  ? null
                  : message._id || message.id
              );
            }}
            onSaveEdit={onEditMessage}
            onStartChat={onStartChat}
          />
        </div>
      </div>
    );
  };

  const itemKey = (index) => {
    const item = dataItems[index];
    if (!item) return index;
    if (item.type === "day") return `day-${item.day}`;
    if (item.type === "hour") return `hour-${item.day}-${item.hour}`;
    return item.message._id || item.message.id || item.message.tempId;
  };

  const onItemsRendered = ({ visibleStartIndex, visibleStopIndex }) => {
    handleRangeChanged({
      startIndex: visibleStartIndex,
      endIndex: visibleStopIndex,
    });
    // вычисляем дно (альтернатива через scroll listener уже есть, но обновим)
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
      setAtBottomState(atBottom);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {enablePinnedPanel && pinnedMessages.length > 0 && (
        <div className="z-20 bg-transparent">
          <div className="px-2">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-md shadow p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Закреплённые
                </span>
                {pinnedMessages.length > 1 && (
                  <button
                    onClick={() => setShowAllPinned((v) => !v)}
                    className="text-[11px] text-blue-500 hover:underline">
                    {showAllPinned ? "Свернуть" : "Все"}
                  </button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 pb-1">
                {pinnedMessages
                  .slice(0, showAllPinned ? pinnedMessages.length : 1)
                  .map((pm) => {
                    const pid = pm._id || pm.id;
                    return (
                      <button
                        key={pid}
                        onClick={() => scrollToMessage(pid)}
                        className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition whitespace-nowrap">
                        {(pm.content || pm.mediaType || "Сообщение").slice(
                          0,
                          24
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
      <div
        ref={listContainerRef}
        className="flex-1 messages-container relative">
        {dataItems.length === 0 ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-10 select-none">
            Сообщений пока нет
          </div>
        ) : (
          <List
            ref={listRef}
            height={containerHeight || 400}
            itemCount={dataItems.length}
            itemKey={itemKey}
            itemSize={getSize}
            width="100%"
            outerRef={scrollContainerRef}
            overscanCount={8}
            onItemsRendered={onItemsRendered}
            className="outline-none"
            style={{ overflowX: "hidden" }}>
            {ItemRow}
          </List>
        )}
      </div>
      {newMessagesCount > 0 && (
        <NewMessagesButton
          count={newMessagesCount}
          onClick={() => scrollToBottom()}
        />
      )}
    </div>
  );
});
