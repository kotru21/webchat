// moved from components/Profile/ImageCropperModal.jsx
import Cropper from "react-easy-crop";

const ImageCropperModal = ({
  image,
  crop,
  zoom,
  aspect,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onClose,
  onApply,
  title,
}) => (
  <div className="fixed inset-0 z-50 flex flex-col bg-black/80 animate-fade-in">
    <div className="m3-surface-high w-full border-b border-border/70 p-4 shadow-lg">
      <h3 className="mb-2 text-lg font-medium text-foreground">
        {title}
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Измените размер и положение изображения
      </p>
    </div>
    <div className="relative grow">
      <Cropper
        image={image}
        crop={crop}
        zoom={zoom}
        aspect={aspect}
        onCropChange={onCropChange}
        onZoomChange={onZoomChange}
        onCropComplete={(_, area) => onCropComplete(area)}
        style={{ containerStyle: { height: "100%", width: "100%" } }}
      />
    </div>
    <div className="m3-surface-high flex justify-between border-t border-border/70 p-4 shadow-lg">
      <button
        type="button"
        onClick={onClose}
        className="m3-pill border border-border/80 bg-card/80 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
        Отмена
      </button>
      <div className="flex items-center space-x-4">
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-32"
        />
        <button
          type="button"
          onClick={onApply}
          className="m3-pill bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-105">
          Применить
        </button>
      </div>
    </div>
  </div>
);

export default ImageCropperModal;
