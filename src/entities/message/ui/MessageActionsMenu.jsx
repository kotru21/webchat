import { Button } from "@shared/ui/button";

export function MessageActionsMenu({
  menuRef,
  isMenuOpen,
  isOwnMessage,
  menuPosition,
  isDeleted,
  isPinned,
  onStartEdit,
  onDelete,
  onTogglePin,
}) {
  const handleAction = (handler) => (event) => {
    event.stopPropagation();
    handler?.();
  };

  return (
    <div
      ref={menuRef}
      className={`absolute flex flex-col gap-2 transition-all duration-300 ease-in-out ${
        isMenuOpen ? "opacity-100 z-20" : "opacity-0 pointer-events-none"
      } m3-surface-high z-10 rounded-2xl border border-border/70 px-3 py-3 text-popover-foreground shadow-xl`}
      style={{
        left: isOwnMessage ? "auto" : `${menuPosition.x}px`,
        right: isOwnMessage ? `${menuPosition.x}px` : "auto",
        top: `${menuPosition.y}px`,
      }}>
      {isOwnMessage && (
        <>
          {!isDeleted && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAction(onStartEdit)}
              className="h-8 justify-start px-2 text-primary hover:text-primary">
              Редактировать
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAction(onDelete)}
            className="h-8 justify-start px-2 text-destructive hover:text-destructive">
            Удалить
          </Button>
        </>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAction(onTogglePin)}
        className="h-8 justify-start px-2 text-amber-600 hover:text-amber-700">
        {isPinned ? "Открепить" : "Закрепить"}
      </Button>
    </div>
  );
}

export default MessageActionsMenu;
