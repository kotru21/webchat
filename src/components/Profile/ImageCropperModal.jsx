import React from "react";
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
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col z-50 animate-fade-in">
      <div className="p-4 bg-white dark:bg-gray-800 shadow-lg w-full">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Измените размер и положение изображения
        </p>
      </div>
      <div className="flex-grow relative">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={(_, croppedAreaPixels) =>
            onCropComplete(croppedAreaPixels)
          }
          style={{ containerStyle: { height: "100%", width: "100%" } }}
        />
      </div>
      <div className="p-4 bg-white dark:bg-gray-800 shadow-lg flex justify-between">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50">
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
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
