import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/** @type {{ id: symbol, panel: HTMLElement | null }[]} */
const dialogStack = [];

function getFocusable(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
  );
}

function isTopDialog(id) {
  return dialogStack[dialogStack.length - 1]?.id === id;
}

/**
 * Lightweight modal shell: role=dialog, aria-modal, Esc, focus trap, restore focus.
 * Nested dialogs use a stack so Esc/Tab apply only to the topmost.
 */
export function AccessibleDialog({
  open = true,
  onClose,
  labelledBy,
  label,
  className = "",
  panelClassName = "",
  initialFocusRef,
  children,
  onBackdropClick,
}) {
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const dialogIdRef = useRef(Symbol("dialog"));

  useEffect(() => {
    if (!open) return undefined;

    const id = dialogIdRef.current;
    restoreFocusRef.current = document.activeElement;
    dialogStack.push({ id, panel: panelRef.current });

    const focusTarget =
      initialFocusRef?.current ||
      getFocusable(panelRef.current)[0] ||
      panelRef.current;

    queueMicrotask(() => {
      const entry = dialogStack.find((d) => d.id === id);
      if (entry) entry.panel = panelRef.current;
      focusTarget?.focus?.();
    });

    const previousOverflow = document.body.style.overflow;
    if (dialogStack.length === 1) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      const idx = dialogStack.findIndex((d) => d.id === id);
      if (idx >= 0) dialogStack.splice(idx, 1);
      if (dialogStack.length === 0) {
        document.body.style.overflow = previousOverflow;
      }
      const restore = restoreFocusRef.current;
      if (
        restore &&
        typeof restore.focus === "function" &&
        dialogStack.length === 0
      ) {
        restore.focus();
      } else if (
        restore &&
        typeof restore.focus === "function" &&
        dialogStack.length > 0
      ) {
        const parent = dialogStack[dialogStack.length - 1]?.panel;
        const fallback = getFocusable(parent)[0] || parent;
        fallback?.focus?.();
      }
    };
  }, [open, initialFocusRef]);

  useEffect(() => {
    if (!open) return undefined;

    const id = dialogIdRef.current;

    const onKeyDown = (event) => {
      if (!isTopDialog(id)) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable(panelRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current?.focus?.();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdrop = (event) => {
    if (event.target !== event.currentTarget) return;
    if (onBackdropClick) {
      onBackdropClick(event);
      return;
    }
    onClose?.();
  };

  return createPortal(
    <div
      className={className}
      onClick={handleBackdrop}
      data-accessible-dialog-backdrop="">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={!labelledBy ? label : undefined}
        tabIndex={-1}
        className={panelClassName}
        style={{ cursor: "auto" }}
        onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default AccessibleDialog;
