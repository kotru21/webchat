import { memo } from "react";

export const HourSeparator = memo(function HourSeparator({ hour, gap = 16 }) {
  return (
    <div
      className="w-full flex justify-center mt-2"
      style={{ paddingBottom: gap }}>
      <span className="text-[10px] tracking-wider uppercase text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
        {hour}:00
      </span>
    </div>
  );
});
