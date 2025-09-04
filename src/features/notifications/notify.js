import { useNotificationsStore } from "./store/notificationsStore";

// Простой helper. Для вызова вне реакта можно экспортировать функцию, принимающую store через getState().
export function notify(type, message, opts = {}) {
  const { push } = useNotificationsStore.getState();
  push({ type, message, ...opts });
}

export function notifySuccess(message, opts) {
  notify("success", message, opts);
}
export function notifyError(message, opts) {
  notify("error", message, opts);
}
export function notifyInfo(message, opts) {
  notify("info", message, opts);
}
export function notifyWarning(message, opts) {
  notify("warning", message, opts);
}
