import { memo } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { Button } from "@shared/ui/button";
import { useAudioMessage } from "@entities/message/model/useAudioMessage";
import { AudioWaveformBars } from "./AudioWaveformBars";

function AudioMessage({ audioUrl, duration }) {
  const {
    audioRef,
    isPlaying,
    currentTime,
    progress,
    bars,
    durationLabel,
    handlePlayPause,
    handleSeek,
    formatTime,
  } = useAudioMessage({ duration });

  return (
    <div className="flex w-full max-w-md flex-col p-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        crossOrigin="anonymous"
      />
      <div className="flex items-center">
        <Button
          type="button"
          size="icon"
          onClick={handlePlayPause}
          className={`mr-3 shrink-0 rounded-full ${
            isPlaying
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
          aria-label={isPlaying ? "Пауза" : "Воспроизвести"}>
          {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
        </Button>
        <div className="m3-surface relative flex h-14 w-full items-end gap-0.5 overflow-hidden rounded-xl border border-border/70 p-2">
          <div className="flex h-full w-full grow items-center justify-between text-xs text-muted-foreground">
            <span className="mr-2">{formatTime(currentTime)}</span>
            <div
              className="pointer-events-none absolute bottom-0 left-0 h-full bg-primary/18 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
            <AudioWaveformBars bars={bars} isPlaying={isPlaying} />
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="absolute left-0 top-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Позиция воспроизведения"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-valuetext={`${formatTime(currentTime)} из ${durationLabel}`}
            />
            <span className="ml-2">{durationLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(AudioMessage);
