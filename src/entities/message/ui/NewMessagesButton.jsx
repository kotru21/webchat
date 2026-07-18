import { FiArrowDown } from "react-icons/fi";
import { memo } from "react";

export const NewMessagesButton = memo(function NewMessagesButton({
  onClick,
  count,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="m3-pill fixed bottom-28 left-1/2 z-30 flex -translate-x-1/2 cursor-pointer items-center gap-2 bg-primary px-4 py-2 text-primary-foreground shadow-[0_4px_16px_hsl(var(--shadow-color)/0.28)] transition-all duration-200 hover:brightness-105 motion-safe:animate-bounce"
      aria-live="polite"
      aria-atomic="true">
      <span>Новых сообщений: {count}</span>
      <FiArrowDown className="h-4 w-4" aria-hidden />
    </button>
  );
});

export default NewMessagesButton;
