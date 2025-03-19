import React from "react";
import { STATUS_INFO, USER_STATUSES } from "../constants/statusConstants";

// Принцип SRP: компонент только отображает индикатор статуса
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
