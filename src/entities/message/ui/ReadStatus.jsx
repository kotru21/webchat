import { memo } from "react";
import { useReadStatus } from "@entities/message/model/useReadStatus";

function ReadStatusComponent({ message, currentUser }) {
  const { markState } = useReadStatus({
    message,
    currentUserId: currentUser.id,
  });
  if (!markState.shouldRender) return null;
  if (markState.isEmpty)
    return <span className="inline-block text-primary-foreground/55">✓</span>;
  return (
    <div className="relative inline-block">
      <span className="cursor-help text-sm text-primary-foreground/80" {...markState.events}>
        ✓✓
      </span>
      {markState.showReaders && markState.readers.length > 0 && (
        <div className="m3-surface-high absolute bottom-full right-0 z-50 mb-1 w-max rounded-xl border border-border/70 px-3 py-2 text-xs shadow-lg">
          <div className="text-foreground">
            Прочитали:
            <div className="mt-1">
              {markState.readers.map((reader, idx) => {
                const key =
                  reader._id || reader.email || reader.username || idx;
                return (
                  <div key={key}>
                    {reader.username ||
                      reader.email ||
                      "Неизвестный пользователь"}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="m3-surface-high absolute -bottom-1 right-2 h-2 w-2 rotate-45 border-b border-r border-border/70" />
        </div>
      )}
    </div>
  );
}

export default memo(ReadStatusComponent);
