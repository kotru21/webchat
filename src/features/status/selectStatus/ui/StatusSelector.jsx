// moved from components/common/StatusSelector.jsx
import { useState, useRef, useEffect } from "react";
import { STATUS_INFO } from "@constants/statusConstants";
import StatusIndicator from "@entities/status/ui/StatusIndicator";
import { updateStatus, updateActivity } from "@features/status/api/statusApi";
import { FiChevronDown } from "react-icons/fi";
import { TIMEOUTS } from "@constants/appConstants";

const StatusSelector = ({ currentStatus, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      updateActivity().catch((err) => console.error("activity error", err));
    }, TIMEOUTS.ACTIVITY_UPDATE);
    return () => clearInterval(id);
  }, []);
  const handleStatusChange = async (st) => {
    try {
      await updateStatus(st);
      onStatusChange?.(st);
      setIsOpen(false);
    } catch (e) {
      console.error("status change error", e);
    }
  };
  const statuses = Object.values(STATUS_INFO);
  const current = STATUS_INFO[currentStatus] || statuses[0];
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
        <StatusIndicator status={currentStatus} size="sm" />
        <span>{current.name}</span>
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
            {statuses.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => handleStatusChange(s.id)}
                  className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                    currentStatus === s.id
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}>
                  <StatusIndicator status={s.id} size="sm" customClass="mr-2" />
                  <span>{s.name}</span>
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
