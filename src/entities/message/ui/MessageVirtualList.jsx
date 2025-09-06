import { memo, useCallback, useEffect, useRef, useState } from "react";
import { VariableSizeList as List } from "react-window";
import { DaySeparator } from "./DaySeparator";
import { HourSeparator } from "./HourSeparator";
import { MessageItem } from "./MessageItem";

// Ответственность: только виртуализация и измерение высот элементов.
export const MessageVirtualList = memo(function MessageVirtualList({
  flatItems,
  currentUser,
  listRef,
  scrollContainerRef,
  indexByMessageIdRef,
  onItemsRange,
  onDeleteMessage,
  onEditMessage,
  onMediaClick,
  onPinMessage,
  onStartChat,
  activeMessageMenu,
  setActiveMessageMenu,
  gaps = { message: 32, day: 24, hour: 16 },
}) {
  const sizeMapRef = useRef(new Map());
  const [containerHeight, setContainerHeight] = useState(0);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const listContainerRef = useRef(null);
  const pendingResetIndexRef = useRef(null);
  const rafIdRef = useRef(null);
  const messageRefs = useRef({});

  // Закрытие контекстного меню по клику вне и по Escape
  useEffect(() => {
    if (!activeMessageMenu) return;
    const handleOutside = (e) => {
      const container = messageRefs.current[activeMessageMenu];
      if (container && container.contains(e.target)) return; // клик внутри текущего сообщения
      setActiveMessageMenu(null);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setActiveMessageMenu(null);
    };
    document.addEventListener("mousedown", handleOutside, true);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside, true);
      document.removeEventListener("keydown", handleKey);
    };
  }, [activeMessageMenu, setActiveMessageMenu]);

  // Индексация сообщений для scrollToMessage
  useEffect(() => {
    const map = indexByMessageIdRef.current;
    map.clear();
    flatItems.forEach((item, idx) => {
      if (item.type === "message") {
        const id = item.message._id || item.message.id || item.message.tempId;
        if (id) map.set(id, idx);
      }
    });
  }, [flatItems, indexByMessageIdRef]);

  // Измерение контейнера
  useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.clientHeight;
      setContainerHeight(h || 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, []);

  const scheduleReset = useCallback(() => {
    if (rafIdRef.current != null) return;
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
  }, [listRef]);

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

  const getSize = useCallback(
    (index) => sizeMapRef.current.get(index) || 80,
    []
  );

  const ItemRow = ({ index, style }) => {
    const item = flatItems[index];
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
                setSize(index, base + gaps.day);
              }
            }
          }}>
          <DaySeparator day={item.day} gap={gaps.day} />
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
                setSize(index, base + gaps.hour);
              }
            }
          }}>
          <HourSeparator hour={item.hour} gap={gaps.hour} />
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
              setSize(index, base + gaps.message);
            }
          }
        }}
        data-message-id={mid}
        className="message-item message-item-base px-4 md:px-12 lg:px-20 xl:px-24 xl:pr-40">
        <div style={{ paddingBottom: gaps.message }}>
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
            isEditing={editingMessageId === (message._id || message.id)}
            onRequestEdit={() => {
              setEditingMessageId(message._id || message.id);
              // закрыть меню если открыто
              if (activeMessageMenu) setActiveMessageMenu(null);
            }}
            onCancelEdit={() => setEditingMessageId(null)}
            onSaveEdit={async (id, formData) => {
              const ok = await onEditMessage(id, formData);
              if (ok) setEditingMessageId(null);
              return ok;
            }}
            onStartChat={onStartChat}
          />
        </div>
      </div>
    );
  };

  const itemKey = (index) => {
    const item = flatItems[index];
    if (!item) return index;
    if (item.type === "day") return `day-${item.day}`;
    if (item.type === "hour") return `hour-${item.day}-${item.hour}`;
    return item.message._id || item.message.id || item.message.tempId;
  };

  const onItemsRendered = ({ visibleStartIndex, visibleStopIndex }) => {
    onItemsRange?.({
      startIndex: visibleStartIndex,
      endIndex: visibleStopIndex,
    });
  };

  return (
    <div
      ref={listContainerRef}
      className="flex-1 min-h-0 relative opacity-100 transition-opacity duration-250 ease-in-out will-change-[opacity] backface-visibility-hidden messages-list-container">
      {flatItems.length === 0 ? (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-10 select-none">
          Сообщений пока нет
        </div>
      ) : (
        <List
          ref={listRef}
          height={containerHeight || 400}
          itemCount={flatItems.length}
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
  );
});
