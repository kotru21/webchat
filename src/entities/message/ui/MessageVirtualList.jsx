import { memo, useCallback, useEffect, useRef, useState } from "react";
import { List, useDynamicRowHeight } from "react-window";
import { DaySeparator } from "./DaySeparator";
import { HourSeparator } from "./HourSeparator";
import { MessageItem } from "./MessageItem";

const EMPTY_ROW_PROPS = {};

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
  MessageEditorComponent,
  ProfileWidgetComponent,
  activeMessageMenu,
  setActiveMessageMenu,
  gaps = { message: 32, day: 24, hour: 16 },
}) {
  const [editingMessageId, setEditingMessageId] = useState(null);
  const messageRefs = useRef({});
  const rowHeight = useDynamicRowHeight({ defaultRowHeight: 80 });

  const setListApiRef = useCallback(
    (api) => {
      listRef.current = api;
      scrollContainerRef.current = api?.element ?? null;
    },
    [listRef, scrollContainerRef]
  );

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

  const ItemRow = useCallback(({ index, style, ariaAttributes }) => {
    const item = flatItems[index];
    if (!item) return null;
    if (item.type === "day") {
      return (
        <div {...ariaAttributes} style={{ ...style }}>
          <DaySeparator day={item.day} gap={gaps.day} />
        </div>
      );
    }
    if (item.type === "hour") {
      return (
        <div {...ariaAttributes} style={{ ...style }}>
          <HourSeparator hour={item.hour} gap={gaps.hour} />
        </div>
      );
    }
    const message = item.message;
    const mid = message._id || message.id || message.tempId;
    return (
      <div
        {...ariaAttributes}
        style={{ ...style }}
        ref={(el) => {
          if (el) {
            messageRefs.current[mid] = el;
          } else {
            delete messageRefs.current[mid];
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
            MessageEditorComponent={MessageEditorComponent}
            ProfileWidgetComponent={ProfileWidgetComponent}
          />
        </div>
      </div>
    );
  }, [
    activeMessageMenu,
    currentUser,
    flatItems,
    gaps.day,
    gaps.hour,
    gaps.message,
    onDeleteMessage,
    onEditMessage,
    onMediaClick,
    onPinMessage,
    onStartChat,
    MessageEditorComponent,
    ProfileWidgetComponent,
    setActiveMessageMenu,
    editingMessageId,
  ]);

  const onRowsRendered = useCallback((visibleRows) => {
    onItemsRange?.({
      startIndex: visibleRows.startIndex,
      endIndex: visibleRows.stopIndex,
    });
  }, [onItemsRange]);

  return (
    <div
      className="flex-1 min-h-0 relative opacity-100 transition-opacity duration-250 ease-in-out will-change-[opacity] backface-visibility-hidden messages-list-container">
      {flatItems.length === 0 ? (
        <div className="mt-10 select-none text-center text-sm text-muted-foreground">
          Сообщений пока нет
        </div>
      ) : (
        <List
          listRef={setListApiRef}
          defaultHeight={400}
          rowCount={flatItems.length}
          rowHeight={rowHeight}
          rowComponent={ItemRow}
          rowProps={EMPTY_ROW_PROPS}
          overscanCount={8}
          onRowsRendered={onRowsRendered}
          className="outline-none"
          style={{ height: "100%", overflowX: "hidden" }}
        />
      )}
    </div>
  );
});
