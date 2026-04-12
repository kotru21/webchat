import { memo } from "react";

export const PinnedMessagesPanel = memo(function PinnedMessagesPanel({
  pinnedMessages,
  showAll,
  onToggleShowAll,
  onSelect,
  enable = true,
}) {
  if (!enable || !pinnedMessages?.length) return null;
  return (
    <div className="z-20 bg-transparent">
      <div className="px-2">
        <div className="m3-surface-high m3-elev-1 rounded-2xl border border-border/70 p-2 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Закреплённые
            </span>
            {pinnedMessages.length > 1 && (
              <button
                onClick={onToggleShowAll}
                className="text-[11px] font-medium text-primary hover:underline">
                {showAll ? "Свернуть" : "Все"}
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
            {pinnedMessages
              .slice(0, showAll ? pinnedMessages.length : 1)
              .map((pm) => {
                const pid = pm._id || pm.id;
                return (
                  <button
                    key={pid}
                    onClick={() => onSelect?.(pid)}
                    className="m3-pill whitespace-nowrap bg-primary/10 px-2 py-1 text-xs text-primary transition hover:bg-primary/20">
                    {(pm.content || pm.mediaType || "Сообщение").slice(0, 24)}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
});

export default PinnedMessagesPanel;
