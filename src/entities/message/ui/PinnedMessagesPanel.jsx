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
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-md shadow p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Закреплённые
            </span>
            {pinnedMessages.length > 1 && (
              <button
                onClick={onToggleShowAll}
                className="text-[11px] text-blue-500 hover:underline">
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
                    className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition whitespace-nowrap">
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
