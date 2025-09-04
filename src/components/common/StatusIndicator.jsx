import { STATUS_INFO, USER_STATUSES } from "../../constants/statusConstants";

/**
 * Компонент индикатора статуса пользователя
 *
 * @param {string} status - Статус пользователя (online, away, dnd, offline)
 * @param {string} size - Размер индикатора (xs, sm, md, lg, xl)
 * @param {boolean} showTooltip - Показывать всплывающую подсказку при наведении
 * @param {string} customClass - Дополнительные CSS-классы
 */
const StatusIndicator = ({
  status,
  size = "md",
  showTooltip = true,
  customClass = "",
}) => {
  const statusData = STATUS_INFO[status] || STATUS_INFO[USER_STATUSES.OFFLINE];

  // Размеры индикатора
  const sizeClasses = {
    xs: "w-2 h-2",
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`relative inline-block ${customClass}`}>
      <div
        className={`${sizeClass} rounded-full ${statusData.class} border-2 border-white dark:border-gray-800`}
        title={showTooltip ? statusData.text : undefined}
      />
    </div>
  );
};

export default StatusIndicator;
