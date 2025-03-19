import { useState, useRef, useEffect } from "react";
import { STATUS_INFO } from "../constants/statusConstants";
import StatusIndicator from "./StatusIndicator";
import statusService from "../services/statusService";
import { FiChevronDown } from "react-icons/fi";

const StatusSelector = ({ currentStatus, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Обработчик периодического обновления активности
  useEffect(() => {
    const activityInterval = setInterval(() => {
      statusService
        .updateActivity()
        .catch((err) =>
          console.error("Ошибка при обновлении активности:", err)
        );
    }, 60000); // Каждую минуту

    return () => clearInterval(activityInterval);
  }, []);

  const handleStatusChange = async (status) => {
    try {
      await statusService.updateStatus(status);

      if (onStatusChange) {
        onStatusChange(status);
      }

      setIsOpen(false);
    } catch (error) {
      console.error("Ошибка при изменении статуса:", error);
    }
  };

  // Статусы из централизованных констант
  const statuses = Object.values(STATUS_INFO);

  // Информация о текущем статусе
  const currentStatusInfo = STATUS_INFO[currentStatus] || statuses[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
        <StatusIndicator status={currentStatus} size="sm" />
        <span>{currentStatusInfo.name}</span>
        <FiChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Выберите статус
            </h3>
          </div>
          <ul className="py-1">
            {statuses.map((status) => (
              <li key={status.id}>
                <button
                  onClick={() => handleStatusChange(status.id)}
                  className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                    currentStatus === status.id
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}>
                  <StatusIndicator
                    status={status.id}
                    size="sm"
                    customClass="mr-2"
                  />
                  <span>{status.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StatusSelector;
