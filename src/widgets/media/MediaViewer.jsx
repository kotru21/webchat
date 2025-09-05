// Moved to widgets/media per FSD
import { FiX, FiDownload } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { TIMEOUTS } from "@constants/appConstants";

const MediaViewer = ({ media, onClose }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const loadTimeoutRef = useRef(null);
  const imageRef = useRef(null);
  const videoRef = useRef(null);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = media.url;
    link.download = media.url.split("/").pop() || "download";
    link.click();
  };

  const checkIfImageLoaded = (img) => {
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
      return true;
    }
    return false;
  };

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    loadTimeoutRef.current = setTimeout(() => {
      setIsLoaded((prev) => prev || true);
    }, TIMEOUTS.MEDIA_LOAD);
    if (media.type === "image" && imageRef.current) {
      checkIfImageLoaded(imageRef.current);
    }
    return () => loadTimeoutRef.current && clearTimeout(loadTimeoutRef.current);
  }, [media.url, media.type]);

  const handleLoad = () => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setIsLoaded(true);
  };
  const handleError = () => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setHasError(true);
    setIsLoaded(true);
    console.error("Failed to load media:", media.url);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}>
      <div className="relative animate-scale-in">
        <div className="absolute -top-10 right-0 flex gap-4">
          <button
            onClick={handleDownload}
            className="text-white text-2xl hover:text-gray-300 p-2 z-10"
            title="Скачать файл">
            <FiDownload size={24} />
          </button>
          <button
            onClick={onClose}
            className="text-white text-2xl hover:text-gray-300 p-2 z-10"
            title="Закрыть">
            <FiX size={24} />
          </button>
        </div>
        <div
          className="rounded-lg overflow-hidden flex items-center justify-center"
          style={{ width: "min(800px, 90vw)", height: "min(600px, 80vh)" }}>
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {hasError && (
            <div className="text-white text-center p-4">
              <p>Не удалось загрузить медиа.</p>
              <p className="text-sm text-gray-400 mt-2">
                Попробуйте обновить страницу или проверьте соединение с
                сервером.
              </p>
            </div>
          )}
          {media.type === "image" ? (
            <img
              ref={imageRef}
              src={media.url}
              alt="Full screen"
              className={`w-full h-full object-contain transition-opacity duration-300 ${
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
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoadedData={handleLoad}
              onError={handleError}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaViewer;
