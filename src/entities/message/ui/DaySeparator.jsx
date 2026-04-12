import { memo } from "react";

export const DaySeparator = memo(function DaySeparator({ day, gap = 24 }) {
  return (
    <div className="relative">
      <div className="flex justify-center my-2" style={{ paddingBottom: gap }}>
        <span className="m3-surface-high m3-pill select-none border border-border/70 px-4 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
          {day}
        </span>
      </div>
    </div>
  );
});
