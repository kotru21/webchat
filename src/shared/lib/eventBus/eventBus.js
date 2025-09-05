// Event bus (pub/sub) для кросс-слойной коммуникации
// API: eventBus.on(event, fn) -> unsubscribe; eventBus.emit(event, payload)
const listeners = new Map();

export const eventBus = {
  on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return () => this.off(event, fn);
  },
  once(event, fn) {
    const off = this.on(event, (data) => {
      off();
      fn(data);
    });
    return off;
  },
  off(event, fn) {
    const set = listeners.get(event);
    if (!set) return;
    set.delete(fn);
    if (!set.size) listeners.delete(event);
  },
  emit(event, data) {
    const set = listeners.get(event);
    if (!set) return;
    for (const fn of [...set]) {
      try {
        fn(data);
      } catch (e) {
        console.error("[eventBus] listener error", event, e);
      }
    }
  },
  reset() {
    listeners.clear();
  },
};

export default eventBus;
