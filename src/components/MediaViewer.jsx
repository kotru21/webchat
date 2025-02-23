const MediaViewer = ({ media, onClose }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm "
      onClick={handleBackdropClick}>
      <div className="relative max-w-[90vw] max-h-[90vh] m-16">
        <button
          onClick={onClose}
          className="absolute -top-10 -right-6 text-white text-2xl hover:text-gray-300 pt-2">
          ✕
        </button>
        {media.type === "image" ? (
          <img
            src={media.url}
            alt="Full screen"
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
          />
        ) : (
          <video
            src={media.url}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] rounded-xl"
          />
        )}
      </div>
    </div>
  );
};

export default MediaViewer;
