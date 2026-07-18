import { FiArrowDown } from "react-icons/fi";
import { memo } from "react";

export const NewMessagesButton = memo(function NewMessagesButton({
  onClick,
  count,
}) {
  return (
    <button
      onClick={onClick}
      className="m3-pill fixed bottom-28 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 bg-primary px-4 py-2 text-primary-foreground shadow-[0_4px_16px_hsl(var(--shadow-color)/0.28)] transition-all duration-200 hover:brightness-105 animate-bounce">
      <span>Новых сообщений: {count}</span>
      <FiArrowDown className="w-4 h-4" />
    </button>
  );
});

export default NewMessagesButton;
