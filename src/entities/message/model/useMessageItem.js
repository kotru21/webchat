import { useRef, useCallback } from "react";
import useMessageMenu from "@entities/message/lib/useMessageMenu.js";

export function useMessageItem({
  message,
  currentUserId,
  onToggleMenu,
  onPin,
  onSaveEdit,
  isMenuOpen,
  isEditing, // контролируемое состояние
  onRequestEdit,
  onCancelEdit,
}) {
  const isOwnMessage = message.sender._id === currentUserId;
  const messageContentRef = useRef(null);

  const {
    messageRef,
    profileTriggerRef,
    menuRef,
    isProfileOpen,
    setIsProfileOpen,
    menuPosition,
    handleProfileClick,
    handleContextMenu,
    closeMenu,
  } = useMessageMenu({ isOwnMessage, onToggleMenu, isMenuOpen });

  const startEdit = useCallback(() => {
    onRequestEdit?.();
    onToggleMenu?.();
  }, [onRequestEdit, onToggleMenu]);

  const cancelEdit = useCallback(() => {
    onCancelEdit?.();
  }, [onCancelEdit]);

  const saveEdit = useCallback(
    async (formData) => {
      const ok = await onSaveEdit(message._id, formData);
      if (ok) onCancelEdit?.();
    },
    [message._id, onSaveEdit, onCancelEdit]
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

  // TODO: В будущем можно вынести вычисления optimistic/failed в memoized selector
  // из messageStore, если потребуется дополнительная логика.

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
    menuRef,
    closeMenu,
    // refs
    messageContentRef,
    // optimistic status
    isOptimistic,
    isFailed,
  };
}

export default useMessageItem;
