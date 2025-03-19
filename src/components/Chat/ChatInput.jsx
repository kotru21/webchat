import { useState, useRef, memo } from "react";
import { IoMdAttach, IoMdSend } from "react-icons/io";
import { BiLoaderAlt } from "react-icons/bi";

const ChatInput = memo(({ onSendMessage, loading }) => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 50 * 1024 * 1024) {
      setSelectedFile(file);
    } else {
      // Handle error - file too large
      console.error("Файл слишком большой (максимум 50MB)");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    try {
      const formData = new FormData();
      if (newMessage.trim()) formData.append("text", newMessage);
      if (selectedFile) formData.append("media", selectedFile);

      await onSendMessage(formData);
      setNewMessage("");
      setSelectedFile(null);
      fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-2 sm:p-4 pb-10 lg:pb-4 transition-all duration-300 animate-slide-up">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Сообщение..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white min-w-0 transition-all duration-200 focus:shadow-md"
          disabled={loading}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*, video/mp4, video/webm"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex-shrink-0 transition-colors duration-200 transform hover:scale-105">
          <IoMdAttach size={20} />
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 pl-6 pr-6 md:pr-2 md:pl-2 transition-all duration-200 transform hover:scale-105 ripple-effect hover-scale ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}>
          {loading ? (
            <BiLoaderAlt size={20} className="animate-spin" />
          ) : (
            <IoMdSend size={20} />
          )}
        </button>
      </div>
      {selectedFile && (
        <div className="mt-2 text-xs text-gray-500 truncate px-2 animate-fadeIn">
          Файл: {selectedFile.name}
        </div>
      )}
    </form>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
