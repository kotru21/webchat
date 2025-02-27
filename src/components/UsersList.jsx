const UsersList = ({
  users,
  isOpen,
  onClose,
  onUserSelect,
  selectedUser,
  unreadCounts,
}) => {
  return (
    <div
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } fixed md:relative md:translate-x-0 h-full w-72 bg-white dark:bg-gray-800 border-r dark:border-gray-700 transition-transform duration-300 ease-in-out z-20 pt-4 md:pt-2`}>
      <div className="p-4 h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Пользователи</h2>
          <button
            onClick={onClose}
            className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          <div
            onClick={() => onUserSelect(null)}
            className={`flex items-center justify-between mb-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer pt-4 pb-4 pl-4 md:pt-2 md:pb-2 md:pl-2 ${
              !selectedUser ? "bg-blue-50 dark:bg-blue-900" : ""
            }`}>
            <div className="text-sm font-medium">Общий чат</div>
            {unreadCounts["general"] > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCounts["general"]}
              </span>
            )}
          </div>
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => onUserSelect(user)}
              className={`flex items-center justify-between mb-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                selectedUser?.id === user.id
                  ? "bg-blue-50 dark:bg-blue-900"
                  : ""
              }`}>
              <div className="flex items-center space-x-3">
                <div className="relative">
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
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.username || user.email}
                  </p>
                </div>
              </div>
              {unreadCounts[user.id] > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {unreadCounts[user.id]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UsersList;
