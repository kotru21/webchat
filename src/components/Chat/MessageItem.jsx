import ReadStatus from "../ReadStatus";

const MessageItem = ({
  message,
  currentUser,
  onEdit,
  onDelete,
  onMediaClick,
}) => {
  const isOwnMessage = message.sender._id === currentUser.id;

  const renderMessageContent = () => (
    <>
      {message.content && (
        <div className="flex flex-col">
          <p
            className={`text-sm break-words ${
              isOwnMessage ? "text-right" : "text-left"
            }`}>
            {message.content}
          </p>
          {(message.isEdited || message.isDeleted) && (
            <span
              className={`text-xs ${
                isOwnMessage
                  ? "text-right text-gray-300"
                  : "text-left text-gray-500"
              }`}>
              {message.isDeleted ? "удалено" : "изменено"}
            </span>
          )}
        </div>
      )}
      {!message.isDeleted &&
        message.mediaUrl &&
        message.mediaType === "image" && (
          <img
            src={`${import.meta.env.VITE_API_URL}${message.mediaUrl}`}
            alt="Изображение"
            className="lg:max-w-[400px] lg:max-h-[400px] max-w-[200px] rounded-lg mt-2 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onMediaClick(message.mediaUrl, "image")}
          />
        )}
      {!message.isDeleted &&
        message.mediaUrl &&
        message.mediaType === "video" && (
          <video
            src={`${import.meta.env.VITE_API_URL}${message.mediaUrl}`}
            className="max-w-[400px] max-h-[400px] rounded-lg mt-2 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onMediaClick(message.mediaUrl, "video")}>
            Ваш браузер не поддерживает видео.
          </video>
        )}
    </>
  );

  return (
    <div className="message-container group relative">
      <div className="pt-8">
        {isOwnMessage && (
          <div className="absolute -top-2 right-10 hidden group-hover:flex gap-3 bg-white dark:bg-gray-800 py-2 px-4 rounded-md shadow-lg transition-all duration-200 z-10">
            <button
              onClick={onEdit}
              className="text-sm text-blue-500 hover:text-blue-700 dark:hover:text-blue-400">
              Редактировать
            </button>
            <button
              onClick={onDelete}
              className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400">
              Удалить
            </button>
          </div>
        )}

        <div
          className={`flex items-start ${
            isOwnMessage ? "flex-row-reverse" : "flex-row"
          } gap-2 `}>
          <img
            src={
              message.sender.avatar
                ? `${import.meta.env.VITE_API_URL}${message.sender.avatar}`
                : "/default-avatar.png"
            }
            alt={`${message.sender.username || message.sender.email}'s avatar`}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              e.target.src = "/default-avatar.png";
            }}
          />

          <div
            className={`rounded-lg px-4 py-2 ${
              isOwnMessage
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700"
            }`}>
            <div
              className={`text-sm font-medium mb-1 ${
                isOwnMessage ? "text-right" : "text-left"
              }`}>
              {isOwnMessage
                ? "Вы"
                : message.sender.username || message.sender.email}
            </div>
            {renderMessageContent()}
            <div className="flex flex-row-reverse gap-2 mt-1">
              <span
                className={`text-xs opacity-75 ${
                  isOwnMessage ? "text-right mt-1.5" : "text-left"
                }`}>
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
              <ReadStatus message={message} currentUser={currentUser} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
