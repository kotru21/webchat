import { FiArrowDown } from "react-icons/fi";
import { memo } from "react";

export const NewMessagesButton = memo(function NewMessagesButton({
  onClick,
  count,
}) {
  const label = `Новых сообщений: ${count}`;
  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {label}
      </div>
      <button
        type="button"
        onClick={onClick}
        className="m3-pill fixed bottom-28 left-1/2 z-30 flex -translate-x-1/2 cursor-pointer items-center gap-2 bg-primary px-4 py-2 text-primary-foreground shadow-[0_4px_16px_hsl(var(--shadow-color)/0.28)] transition-[filter,transform,box-shadow] duration-200 hover:brightness-105 hover:shadow-[0_6px_20px_hsl(var(--shadow-color)/0.34)] active:scale-[0.98] motion-safe:animate-message-toast-in"
        aria-label={`${label}. Перейти вниз`}>
        <span aria-hidden>{label}</span>
        <FiArrowDown className="h-4 w-4" aria-hidden />
      </button>
    </>
  );
});

export default NewMessagesButton;
