import { useRef, useState } from "react";

export default function useMessageMenu(isOwnMessage, onToggleMenu) {
  const messageRef = useRef(null);
  const profileTriggerRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleProfileClick = (e) => {
    e.stopPropagation();
    setIsProfileOpen((v) => !v);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!messageRef.current) return;
    const rect = messageRef.current.getBoundingClientRect();
    if (isOwnMessage) {
      const rightOffset = rect.width - (e.clientX - rect.left);
      setMenuPosition({ x: rightOffset, y: e.clientY - rect.top });
    } else {
      setMenuPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    onToggleMenu && onToggleMenu();
  };

  const handleClick = () => {
    onToggleMenu && onToggleMenu();
  };

  return {
    messageRef,
    profileTriggerRef,
    isProfileOpen,
    setIsProfileOpen,
    menuPosition,
    handleProfileClick,
    handleContextMenu,
    handleClick,
  };
}
