import { useEffect } from "react";
import { useNotificationsStore } from "@features/notifications/store/notificationsStore";

const typeStyles = {
  success:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  error: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  warning:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
};

export function ToastContainer() {
  const toasts = useNotificationsStore((s) => s.toasts);
  const dismiss = useNotificationsStore((s) => s.dismiss);

  // Источник данных — notificationsStore (notify -> push). Никаких внешних подписок.

  useEffect(() => {
    const timers = toasts.map((t) => {
      if (t.ttl === 0) return null;
      return setTimeout(() => dismiss(t.id), t.ttl);
    });
    return () => timers.forEach((t) => t && clearTimeout(t));
  }, [toasts, dismiss]);

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
      role="region"
      aria-label="Уведомления">
      {toasts.map((t) => {
        const pct = t.ttl
          ? Math.max(0, 100 - ((Date.now() - t.createdAt) / t.ttl) * 100)
          : 0;
        return (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow animate-fade-in text-sm flex flex-col gap-2 ${
              typeStyles[t.type] || typeStyles.info
            }`}
            role="alert"
            aria-live={t.type === "error" ? "assertive" : "polite"}>
            <div className="flex justify-between items-start gap-3">
              <span className="whitespace-pre-wrap break-words flex-1">
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
                      className="text-xs underline hover:opacity-80">
                      {a.label}
                    </button>
                  ))}
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-xs opacity-70 hover:opacity-100"
                  aria-label="Закрыть уведомление">
                  ×
                </button>
              </div>
            </div>
            {t.ttl > 0 && (
              <div className="h-1 w-full bg-black/10 dark:bg-white/10 rounded overflow-hidden">
                <div
                  className="h-full bg-current transition-all"
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
