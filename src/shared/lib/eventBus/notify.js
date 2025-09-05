import eventBus from "./eventBus";

export function notify(type, message, opts = {}) {
  eventBus.emit("notify", { type, message, ...opts });
}
export const notifySuccess = (m, o) => notify("success", m, o);
export const notifyError = (m, o) => notify("error", m, o);
export const notifyInfo = (m, o) => notify("info", m, o);
export const notifyWarning = (m, o) => notify("warning", m, o);

export default notify;
