import Cropper from "react-easy-crop";
import { useId } from "react";
import { AccessibleDialog } from "@shared/ui/AccessibleDialog";
import { Button } from "@shared/ui/button";

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
  title = "Обрезка изображения",
}) => {
  const titleId = useId();

  return (
    <AccessibleDialog
      open
      onClose={onClose}
      labelledBy={titleId}
      className="fixed inset-0 z-[60] flex flex-col bg-black/80 animate-fade-in"
      panelClassName="flex h-full w-full flex-col outline-none"
      onBackdropClick={() => {}}>
      <div className="m3-surface-high w-full border-b border-border/70 p-4 shadow-lg">
        <h3 id={titleId} className="mb-2 text-lg font-medium text-foreground">
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
        <Button type="button" variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="sr-only">Масштаб</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="w-32"
              aria-label="Масштаб изображения"
              aria-valuemin={1}
              aria-valuemax={3}
              aria-valuenow={zoom}
            />
          </label>
          <Button type="button" onClick={onApply}>
            Применить
          </Button>
        </div>
      </div>
    </AccessibleDialog>
  );
};

export default ImageCropperModal;
