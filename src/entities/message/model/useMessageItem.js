import { useState, useRef, useCallback } from "react";
import useMessageMenu from "@entities/message/lib/useMessageMenu.js";

export function useMessageItem({
  message,
  currentUserId,
  onToggleMenu,
  onPin,
  onSaveEdit,
}) {
  const isOwnMessage = message.sender._id === currentUserId;
  const [isEditing, setIsEditing] = useState(false);
  const messageContentRef = useRef(null);

  const {
    messageRef,
    profileTriggerRef,
    isProfileOpen,
    setIsProfileOpen,
    menuPosition,
    handleProfileClick,
    handleContextMenu,
    handleClick,
  } = useMessageMenu(isOwnMessage, onToggleMenu);

  const startEdit = useCallback(() => {
    setIsEditing(true);
    onToggleMenu?.();
  }, [onToggleMenu]);

  const cancelEdit = useCallback(() => setIsEditing(false), []);

  const saveEdit = useCallback(
    async (formData) => {
      await onSaveEdit(message._id, formData);
      setIsEditing(false);
    },
    [message._id, onSaveEdit]
  );

  const togglePin = useCallback(async () => {
    try {
      await onPin(message._id, !message.isPinned);
    } catch (e) {
      console.error("Ошибка при закреплении:", e);
    }
  }, [message._id, message.isPinned, onPin]);

  const isOptimistic =
    message.optimistic || String(message._id).startsWith("temp-");
  const isFailed = message.failed;

  return {
    // ownership
    isOwnMessage,
    // editing state
    isEditing,
    startEdit,
    cancelEdit,
    saveEdit,
    // pin
    togglePin,
    // menu & profile
    messageRef,
    profileTriggerRef,
    isProfileOpen,
    setIsProfileOpen,
    menuPosition,
    handleProfileClick,
    handleContextMenu,
    handleClick,
    // refs
    messageContentRef,
    // optimistic status
    isOptimistic,
    isFailed,
  };
}

export default useMessageItem;
