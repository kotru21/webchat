import { memo } from "react";

export const AudioWaveformBars = memo(function AudioWaveformBars({
  bars,
  isPlaying,
}) {
  return (
    <div className="relative flex h-full w-full items-end gap-0.5">
      {bars.map((height, index) => (
        <div
          key={index}
          className={`flex-1 rounded-sm ${
            isPlaying ? "bg-primary" : "bg-muted-foreground/45"
          }`}
          style={{
            height: `${height}px`,
            minWidth: "2px",
            transition: "height 0.1s ease",
          }}
        />
      ))}
    </div>
  );
});

export default AudioWaveformBars;
