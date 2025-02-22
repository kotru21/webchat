const ReadStatus = ({ message, currentUser }) => {
  const renderReadList = () => {
    if (!message.readBy?.length) return null;

    // Фильтруем текущего пользователя из списка
    const readers = message.readBy.filter(
      (reader) => reader._id !== currentUser.id
    );

    if (readers.length === 0) return null;

    if (message.isPrivate) {
      // Для личных сообщений показываем простой индикатор
      return (
        <span className="text-xs text-gray-500">
          {readers.length > 0 ? "Прочитано" : "Доставлено"}
        </span>
      );
    } else {
      // Для общего чата показываем список с ограничением
      const displayedReaders = readers.slice(0, 6);
      const remaining = readers.length - 6;

      return (
        <div
          className={`text-xs text-gray-500 ${
            message.sender._id === currentUser.id ? "text-right" : "text-left"
          }`}>
          Прочитали:{" "}
          {displayedReaders.map((reader) => reader.username).join(", ")}
          {remaining > 0 && ` и ещё ${remaining} человек`}
        </div>
      );
    }
  };

  return <div className="mt-1">{renderReadList()}</div>;
};

export default ReadStatus;
