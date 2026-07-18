import { memo, useCallback, useEffect, useRef } from "react";
import { List, useDynamicRowHeight } from "react-window";
import { DaySeparator } from "./DaySeparator";
import { HourSeparator } from "./HourSeparator";
import { MessageItem } from "./MessageItem";

const EMPTY_ROW_PROPS = {};

export const MessageVirtualList = memo(function MessageVirtualList({
  flatItems,
  currentUser,
  listRef,
  scrollContainerRef,
  indexByMessageIdRef,
  onItemsRange,
  onMediaClick,
  onOpenProfile,
  // Material 3 (4/8dp): 16dp between bubbles, 24dp around day chips, 16dp hour marks
  gaps = { message: 16, day: 24, hour: 16 },
}) {
  const messageRefs = useRef({});
  const rowHeight = useDynamicRowHeight({ defaultRowHeight: 112 });

  const setListApiRef = useCallback(
    (api) => {
      listRef.current = api;
      scrollContainerRef.current = api?.element ?? null;
    },
    [listRef, scrollContainerRef]
  );

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

  const ItemRow = useCallback(
    ({ index, style, ariaAttributes }) => {
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
          className="message-item message-item-base px-4 sm:px-6 md:px-12 lg:px-20 xl:px-24 xl:pr-40">
          <div style={{ paddingBottom: gaps.message }}>
            <MessageItem
              message={message}
              currentUser={currentUser}
              onMediaClick={onMediaClick}
              onOpenProfile={onOpenProfile}
            />
          </div>
        </div>
      );
    },
    [
      currentUser,
      flatItems,
      gaps.day,
      gaps.hour,
      gaps.message,
      onMediaClick,
      onOpenProfile,
    ]
  );

  const onRowsRendered = useCallback(
    (visibleRows) => {
      onItemsRange?.({
        startIndex: visibleRows.startIndex,
        endIndex: visibleRows.stopIndex,
      });
    },
    [onItemsRange]
  );

  return (
    <div className="flex-1 min-h-0 relative opacity-100 transition-opacity duration-250 ease-in-out will-change-[opacity] backface-visibility-hidden messages-list-container">
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
