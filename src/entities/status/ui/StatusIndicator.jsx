// moved from components/common/StatusIndicator.jsx
import { STATUS_INFO, USER_STATUSES } from "@constants/statusConstants";

const sizeClasses = {
  xs: "w-2 h-2",
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
  xl: "w-6 h-6",
};

export function StatusIndicator({
  status,
  size = "md",
  showTooltip = true,
  customClass = "",
}) {
  const statusData = STATUS_INFO[status] || STATUS_INFO[USER_STATUSES.OFFLINE];
  const cls = sizeClasses[size] || sizeClasses.md;
  return (
    <div className={`relative inline-block ${customClass}`}>
      <div
        className={`${cls} rounded-full ${statusData.class} border-2 border-white dark:border-gray-800`}
        title={showTooltip ? statusData.text : undefined}
      />
    </div>
  );
}

export default StatusIndicator;
