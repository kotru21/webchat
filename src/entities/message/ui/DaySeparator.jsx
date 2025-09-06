import { memo } from "react";

export const DaySeparator = memo(function DaySeparator({ day, gap = 24 }) {
  return (
    <div className="relative">
      <div className="flex justify-center my-2" style={{ paddingBottom: gap }}>
        <span className="px-4 py-1 text-xs font-medium bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full shadow-sm select-none backdrop-blur-sm bg-opacity-70 dark:bg-opacity-50">
          {day}
        </span>
      </div>
    </div>
  );
});
