import { useEffect, useState } from "react";
import { useNotificationsStore } from "@features/notifications/store/notificationsStore";

const typeStyles = {
  success: "border-emerald-500/55",
  error: "border-destructive/55",
  info: "border-primary/55",
  warning: "border-amber-500/55",
};

export function ToastContainer() {
  const toasts = useNotificationsStore((s) => s.toasts);
  const dismiss = useNotificationsStore((s) => s.dismiss);
  const [now, setNow] = useState(() => Date.now());

  // Источник данных — notificationsStore (notify -> push). Никаких внешних подписок.

  useEffect(() => {
    const hasTimedToasts = toasts.some((t) => t.ttl > 0);
    if (!hasTimedToasts) {
      return undefined;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, [toasts]);

  useEffect(() => {
    const timers = toasts.map((t) => {
      if (t.ttl === 0) return null;

      const elapsed = Date.now() - t.createdAt;
      const remaining = Math.max(0, t.ttl - elapsed);

      if (remaining === 0) {
        dismiss(t.id);
        return null;
      }

      return setTimeout(() => dismiss(t.id), remaining);
    });
    return () => timers.forEach((t) => t && clearTimeout(t));
  }, [toasts, dismiss]);

  return (
    <div
      className="fixed right-4 top-4 z-50 flex max-w-sm flex-col gap-2"
      role="region"
      aria-label="Уведомления">
      {toasts.map((t) => {
        const pct = t.ttl
          ? Math.max(0, 100 - ((now - t.createdAt) / t.ttl) * 100)
          : 0;
        return (
          <div
            key={t.id}
            className={`m3-surface-high m3-elev-2 animate-fade-in flex flex-col gap-2 rounded-2xl border-l-4 px-4 py-3 text-sm ${
              typeStyles[t.type] || typeStyles.info
            }`}
            role="alert"
            aria-live={t.type === "error" ? "assertive" : "polite"}>
            <div className="flex justify-between items-start gap-3">
              <span className="flex-1 whitespace-pre-wrap wrap-break-word">
                {t.message}
              </span>
              <div className="flex gap-2 items-center">
                {t.actions &&
                  t.actions.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => {
                        a.onClick?.();
                        dismiss(t.id);
                      }}
                      className="text-xs font-medium text-primary underline-offset-2 hover:underline">
                      {a.label}
                    </button>
                  ))}
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-xs opacity-70 transition-opacity hover:opacity-100"
                  aria-label="Закрыть уведомление">
                  ×
                </button>
              </div>
            </div>
            {t.ttl > 0 && (
              <div className="h-1 w-full overflow-hidden rounded bg-foreground/10">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: pct + "%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;
