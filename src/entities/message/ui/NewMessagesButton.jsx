import { FiArrowDown } from "react-icons/fi";
import { memo } from "react";

export const NewMessagesButton = memo(function NewMessagesButton({
  onClick,
  count,
}) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 flex items-center space-x-2 z-30 animate-bounce">
      <span>Новых сообщений: {count}</span>
      <FiArrowDown className="w-4 h-4" />
    </button>
  );
});

export default NewMessagesButton;
