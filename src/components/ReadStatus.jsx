import { useState, useEffect } from "react";

const ReadStatus = ({ message, currentUser }) => {
  const [showReaders, setShowReaders] = useState(false);
  const [readers, setReaders] = useState([]);

  useEffect(() => {
    // фильтрация массива прочитавших и исключение отправителя
    if (Array.isArray(message.readBy)) {
      const filteredReaders = message.readBy.filter(
        (reader) => reader._id !== message.sender._id
      );
      setReaders(filteredReaders);
    } else {
      setReaders([]);
    }
  }, [message]);

  // не показываем статус прочтения для НЕ отправителя
  if (message.sender._id !== currentUser.id) {
    return null;
  }

  const renderReadStatus = () => {
    if (!Array.isArray(readers) || readers.length === 0) {
      // Сообщение не прочитано никем
      return <span className="text-gray-400">✓</span>;
    }

    // Сообщение прочитано
    return (
      <div className="relative inline-block">
        <span
          className="text-blue-200 cursor-help text-sm"
          onMouseEnter={() => setShowReaders(true)}
          onMouseLeave={() => setShowReaders(false)}>
          ✓✓
        </span>

        {/* Всплывающий список прочитавших */}
        {showReaders && readers.length > 0 && (
          <div className="absolute bottom-full right-0 mb-1 w-max bg-white dark:bg-gray-800 shadow-lg rounded-md py-2 px-3 text-xs z-50">
            <div className="text-gray-700 dark:text-gray-300">
              Прочитали:
              <div className="mt-1">
                {readers.map((reader, idx) => {
                  const key =
                    reader._id || reader.email || reader.username || idx;
                  return (
                    <div key={key}>
                      {reader.username ||
                        reader.email ||
                        "Неизвестный пользователь"}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Треугольник снизу */}
            <div className="absolute -bottom-1 right-2 w-2 h-2 bg-white dark:bg-gray-800 transform rotate-45"></div>
          </div>
        )}
      </div>
    );
  };

  return <div className="inline-flex items-center">{renderReadStatus()}</div>;
};

export default ReadStatus;
