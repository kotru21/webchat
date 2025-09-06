import { useRef, useState, useEffect, useCallback } from "react";

export default function useMessageMenu({
  isOwnMessage,
  onToggleMenu,
  isMenuOpen,
}) {
  const messageRef = useRef(null);
  const profileTriggerRef = useRef(null);
  const menuRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const closeMenu = useCallback(() => {
    if (isMenuOpen) onToggleMenu && onToggleMenu();
  }, [isMenuOpen, onToggleMenu]);

  const handleProfileClick = (e) => {
    e.stopPropagation();
    setIsProfileOpen((v) => !v);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!messageRef.current) return;
    // если ПКМ по самому сообщению — открыть (или переместить) меню
    const rect = messageRef.current.getBoundingClientRect();
    if (isOwnMessage) {
      const rightOffset = rect.width - (e.clientX - rect.left);
      setMenuPosition({ x: rightOffset, y: e.clientY - rect.top });
    } else {
      setMenuPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    onToggleMenu && onToggleMenu();
  };

  // закрытие: ЛКМ вне меню/сообщения или ПКМ вне сообщения
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleGlobalMouseDown = (e) => {
      if (!messageRef.current) return;
      if (
        messageRef.current.contains(e.target) ||
        (menuRef.current && menuRef.current.contains(e.target))
      ) {
        return;
      }
      closeMenu();
    };
    const handleGlobalContext = (e) => {
      if (!messageRef.current) return;
      if (!messageRef.current.contains(e.target)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleGlobalMouseDown, true);
    document.addEventListener("contextmenu", handleGlobalContext, true);
    return () => {
      document.removeEventListener("mousedown", handleGlobalMouseDown, true);
      document.removeEventListener("contextmenu", handleGlobalContext, true);
    };
  }, [isMenuOpen, closeMenu]);

  return {
    messageRef,
    profileTriggerRef,
    menuRef,
    isProfileOpen,
    setIsProfileOpen,
    menuPosition,
    handleProfileClick,
    handleContextMenu,
    closeMenu,
  };
}
