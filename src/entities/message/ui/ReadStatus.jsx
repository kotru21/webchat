import { memo } from "react";
import { useReadStatus } from "@entities/message/model/useReadStatus";

function ReadStatusComponent({ message, currentUser }) {
  const { markState } = useReadStatus({
    message,
    currentUserId: currentUser.id,
  });
  if (!markState.shouldRender) return null;
  if (markState.isEmpty)
    return <span className="text-gray-400 inline-block">✓</span>;
  return (
    <div className="relative inline-block">
      <span className="text-blue-200 cursor-help text-sm" {...markState.events}>
        ✓✓
      </span>
      {markState.showReaders && markState.readers.length > 0 && (
        <div className="absolute bottom-full right-0 mb-1 w-max bg-white dark:bg-gray-800 shadow-lg rounded-md py-2 px-3 text-xs z-50">
          <div className="text-gray-700 dark:text-gray-300">
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
          <div className="absolute -bottom-1 right-2 w-2 h-2 bg-white dark:bg-gray-800 transform rotate-45" />
        </div>
      )}
    </div>
  );
}

export default memo(ReadStatusComponent);
