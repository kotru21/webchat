import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ChatHeader from "../components/Chat/ChatHeader";
import ChatMessages from "../components/Chat/ChatMessages";
import ChatInput from "../components/Chat/ChatInput";
import UsersList from "../components/UsersList";
import MediaViewer from "../components/MediaViewer";
import ProfileEditor from "../components/ProfileEditor";
import useChatSocket from "../hooks/useChatSocket";
import useChatMessages from "../hooks/useChatMessages";
import { updateProfile } from "../services/api";
import api from "../services/api";

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({ general: 0 });
  const { user, updateUser } = useAuth();

  const {
    messages,
    setMessages,
    loading,
    error,
    setError,
    sendMessageHandler,
    markAsReadHandler,
    editMessageHandler,
    deleteMessageHandler,
  } = useChatMessages(selectedUser);

  const { onlineUsers } = useChatSocket({
    user,
    selectedUser,
    setMessages,
    setUnreadCounts,
  });

  const handleMediaClick = (mediaUrl, mediaType) => {
    setFullscreenMedia({
      url: `${import.meta.env.VITE_API_URL}${mediaUrl}`,
      type: mediaType,
    });
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setUnreadCounts((prev) => {
      const newCounts = { ...prev };
      user ? delete newCounts[user.id] : (newCounts.general = 0);
      return newCounts;
    });
  };

  const handleProfileUpdate = async (formData) => {
    try {
      const response = await updateProfile(formData);
      const updatedUser = response?.user || response;
      if (updatedUser && updatedUser.id) {
        updateUser(updatedUser);
      } else {
        const userResponse = await api.get("/api/auth/me");
        updateUser(userResponse.data);
      }
      setIsProfileEditorOpen(false);
      setError("");
    } catch (error) {
      setError("Ошибка при обновлении профиля");
      console.error("Profile update error:", error);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      console.log("Sending user_connected with:", user);
      // Здесь предполагается отправка события user_connected через WebSocket
    } else {
      console.error("User data is incomplete:", user);
    }
  }, [user]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-none md:w-72">
        <UsersList
          users={onlineUsers.filter((u) => u.id !== user.id)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onUserSelect={handleUserSelect}
          selectedUser={selectedUser}
          unreadCounts={unreadCounts}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <ChatHeader
          user={user}
          selectedUser={selectedUser}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenProfileEditor={() => setIsProfileEditorOpen(true)}
        />

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4"
            role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <ChatMessages
          messages={messages}
          currentUser={user}
          onMarkAsRead={markAsReadHandler}
          onEditMessage={editMessageHandler}
          onDeleteMessage={deleteMessageHandler}
          onMediaClick={handleMediaClick}
        />

        <ChatInput onSendMessage={sendMessageHandler} loading={loading} />
      </div>

      {fullscreenMedia && (
        <MediaViewer
          media={fullscreenMedia}
          onClose={() => setFullscreenMedia(null)}
        />
      )}

      {isProfileEditorOpen && (
        <ProfileEditor
          user={user}
          onSave={handleProfileUpdate}
          onClose={() => setIsProfileEditorOpen(false)}
        />
      )}
    </div>
  );
};

export default Chat;
