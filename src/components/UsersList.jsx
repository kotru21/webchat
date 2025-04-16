import { memo } from "react";
import StatusIndicator from "./common/StatusIndicator";
import { FiX } from "react-icons/fi";

const UsersList = memo(
  ({ users, isOpen, onClose, onUserSelect, selectedUser, unreadCounts }) => {
    return (
      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:relative md:translate-x-0 h-full w-72 bg-white dark:bg-gray-800 
        border-r dark:border-gray-700 transition-all duration-300 ease-in-out z-20`}>
        <div className="p-4 h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Пользователи</h2>
            <button
              onClick={onClose}
              className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <FiX size={18} />
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100%-4rem)] overflow-x-hidden">
            <div
              onClick={() => onUserSelect(null)}
              className={`chat-item p-3 cursor-pointer rounded-lg flex items-center justify-between ${
                !selectedUser ? "chat-item-selected" : ""
              }`}>
              <div className="text-sm font-medium truncate flex-1">
                Общий чат
              </div>
              {unreadCounts["general"] > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] text-center">
                  {unreadCounts["general"]}
                </span>
              )}
            </div>
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => onUserSelect(user)}
                className={`chat-item p-3 cursor-pointer rounded-lg ${
                  selectedUser?.id === user.id ? "chat-item-selected" : ""
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          user.avatar
                            ? `${import.meta.env.VITE_API_URL}${user.avatar}`
                            : "/default-avatar.png"
                        }
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = "/default-avatar.png";
                        }}
                      />
                      <StatusIndicator
                        status={user.status || "offline"}
                        size="sm"
                        customClass="absolute bottom-0 right-0"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.username || user.email}
                      </p>
                    </div>
                  </div>
                  {unreadCounts[user.id] > 0 && (
                    <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] text-center">
                      {unreadCounts[user.id]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

UsersList.displayName = "UsersList";

export default UsersList;
