import { memo } from "react";

export const HourSeparator = memo(function HourSeparator({ hour, gap = 16 }) {
  return (
    <div
      className="w-full flex justify-center mt-2"
      style={{ paddingBottom: gap }}>
      <span className="m3-surface m3-pill px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {hour}:00
      </span>
    </div>
  );
});
