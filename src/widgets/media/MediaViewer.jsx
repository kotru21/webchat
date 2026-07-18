import { FiX, FiDownload } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { TIMEOUTS } from "@constants/appConstants";
import { AccessibleDialog } from "@shared/ui/AccessibleDialog";
import { Button } from "@shared/ui/button";

const MediaViewer = ({ media, onClose }) => {
  const [loadState, setLoadState] = useState({
    url: media.url,
    isLoaded: false,
    hasError: false,
  });
  const loadTimeoutRef = useRef(null);
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const closeBtnRef = useRef(null);

  if (loadState.url !== media.url) {
    setLoadState({ url: media.url, isLoaded: false, hasError: false });
  }

  const { isLoaded, hasError } = loadState;

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = media.url;
    link.download = media.url.split("/").pop() || "download";
    link.click();
  };

  useEffect(() => {
    loadTimeoutRef.current = setTimeout(() => {
      setLoadState((prev) =>
        prev.url === media.url ? { ...prev, isLoaded: true } : prev
      );
    }, TIMEOUTS.MEDIA_LOAD);

    const img = imageRef.current;
    if (
      media.type === "image" &&
      img &&
      img.complete &&
      img.naturalWidth > 0
    ) {
      queueMicrotask(() => {
        setLoadState((prev) =>
          prev.url === media.url
            ? { ...prev, isLoaded: true, hasError: false }
            : prev
        );
      });
    }

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [media.url, media.type]);

  const handleLoad = () => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setLoadState((prev) =>
      prev.url === media.url
        ? { ...prev, isLoaded: true, hasError: false }
        : prev
    );
  };
  const handleError = () => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setLoadState((prev) =>
      prev.url === media.url
        ? { ...prev, isLoaded: true, hasError: true }
        : prev
    );
    console.error("Failed to load media:", media.url);
  };

  return (
    <AccessibleDialog
      open
      onClose={onClose}
      label="Просмотр медиа"
      initialFocusRef={closeBtnRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      panelClassName="relative outline-none animate-scale-in">
      <div className="absolute -top-10 right-0 flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          className="h-12 w-12 text-white hover:bg-white/10 hover:text-white"
          aria-label="Скачать файл">
          <FiDownload size={24} />
        </Button>
        <Button
          ref={closeBtnRef}
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-12 w-12 text-white hover:bg-white/10 hover:text-white"
          aria-label="Закрыть">
          <FiX size={24} />
        </Button>
      </div>
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-lg"
        style={{ width: "min(800px, 90vw)", height: "min(600px, 80vh)" }}>
        {!isLoaded && !hasError && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            role="status">
            <span className="sr-only">Загрузка медиа…</span>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
        {hasError && (
          <div className="p-4 text-center text-white" role="alert">
            <p>Не удалось загрузить медиа.</p>
            <p className="mt-2 text-sm text-white/70">
              Попробуйте обновить страницу или проверьте соединение с сервером.
            </p>
          </div>
        )}
        {media.type === "image" ? (
          <img
            ref={imageRef}
            src={media.url}
            alt="Медиа во весь экран"
            className={`h-full w-full object-contain transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
          <video
            ref={videoRef}
            src={media.url}
            controls
            autoPlay
            className={`h-full w-full object-contain transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoadedData={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    </AccessibleDialog>
  );
};

export default MediaViewer;
