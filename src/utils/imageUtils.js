/**
 * Функция для кадрирования изображения
 *
 * @param {string} imageSrc - Исходное изображение (base64 или URL)
 * @param {Object} pixelCrop - Область кадрирования (x, y, width, height)
 * @param {string} format - Формат изображения на выходе (по умолчанию jpeg)
 * @param {number} quality - Качество изображения (от 0 до 1)
 * @returns {Promise<Blob>} - Blob кадрированного изображения
 */
export const getCroppedImg = async (
  imageSrc,
  pixelCrop,
  format = "image/jpeg",
  quality = 0.92
) => {
  const image = new Image();
  image.src = imageSrc;

  // Дожидаемся загрузки изображения
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Устанавливаем размеры canvas равными размерам кадрируемой области
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Отрисовываем нужную часть изображения на canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Конвертируем canvas в Blob с указанным форматом и качеством
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      format,
      quality
    );
  });
};

/**
 * Функция для изменения размера изображения
 *
 * @param {Blob} imageBlob - Исходное изображение
 * @param {number} maxWidth - Максимальная ширина
 * @param {number} maxHeight - Максимальная высота
 * @returns {Promise<Blob>} - Blob изображения с измененным размером
 */
export const resizeImage = async (imageBlob, maxWidth, maxHeight) => {
  const imageSrc = URL.createObjectURL(imageBlob);
  const image = new Image();
  image.src = imageSrc;

  await new Promise((resolve) => {
    image.onload = resolve;
  });

  // Вычисляем новые размеры с сохранением пропорций
  let newWidth = image.width;
  let newHeight = image.height;

  if (newWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = (image.height * maxWidth) / image.width;
  }

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = (image.width * maxHeight) / image.height;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = newWidth;
  canvas.height = newHeight;

  ctx.drawImage(image, 0, 0, newWidth, newHeight);
  URL.revokeObjectURL(imageSrc);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      imageBlob.type,
      0.92
    );
  });
};

export default getCroppedImg;
