// Чистая презентация профиля
import StatusIndicator from "@entities/status/ui/StatusIndicator";
import { STATUS_INFO } from "@constants/statusConstants";

export function ProfileCard({ profile, onStartChat, isCurrentUser, onClose }) {
  if (!profile) return null;
  const statusInfo = STATUS_INFO[profile.status] || STATUS_INFO.offline;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[320px] overflow-hidden">
      <div className="h-28 overflow-hidden relative">
        {profile.banner ? (
          <img
            src={`${import.meta.env.VITE_API_URL}${profile.banner}`}
            alt="Баннер"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-600" />
        )}
      </div>
      <div className="relative px-4 pb-4">
        <div className="flex justify-between items-end -mt-10 mb-3">
          <div className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gray-200 dark:bg-gray-700">
            <img
              src={
                profile.avatar
                  ? `${import.meta.env.VITE_API_URL}${profile.avatar}`
                  : "/default-avatar.png"
              }
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
              className="w-full h-full object-cover"
              alt="avatar"
            />
          </div>
          <div className="flex items-center gap-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full mb-2">
            <StatusIndicator status={profile.status || "offline"} size="xs" />
            <span className="text-gray-700 dark:text-gray-300">
              {statusInfo.name}
            </span>
          </div>
        </div>
        <div className="mb-3 text-left">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
            {profile.username || "Пользователь"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {profile.email}
          </p>
        </div>
        {profile.description && (
          <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed break-words whitespace-pre-line">
            {profile.description}
          </div>
        )}
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Зарегистрирован: {new Date(profile.createdAt).toLocaleDateString()}
        </div>
        {onStartChat && !isCurrentUser && (
          <div className="mt-4">
            <button
              onClick={() => {
                onStartChat({
                  id: profile._id || profile.id,
                  username: profile.username,
                  avatar: profile.avatar,
                  status: profile.status,
                  email: profile.email,
                });
                onClose && onClose();
              }}
              className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm">
              Написать сообщение
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileCard;
