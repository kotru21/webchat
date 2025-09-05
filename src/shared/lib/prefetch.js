// Простая утилита префетча чанков через динамический импорт по событию (hover/focus)
export function prefetch(importer) {
  // Вызов промиса без await позволяет браузеру подгружать чанк
  try {
    importer();
  } catch {
    /* ignore */
  }
}

export function setupHoverPrefetch(el, importer) {
  if (!el) return;
  const handler = () => prefetch(importer);
  el.addEventListener("mouseenter", handler, { once: true });
  el.addEventListener("focus", handler, { once: true });
  return () => {
    el.removeEventListener("mouseenter", handler);
    el.removeEventListener("focus", handler);
  };
}
