import { useCallback, useEffect, useState } from "react";
import { getCroppedImg } from "@utils/imageUtils";
import { FILE_LIMITS } from "@constants/appConstants";
import { toAbsoluteMediaUrl } from "@shared/lib/mediaUrl";

function createCropperState(type, image) {
  return {
    show: true,
    type,
    image,
    crop: { x: 0, y: 0 },
    zoom: 1,
    aspect: type === "avatar" ? 1 : 4,
    croppedAreaPixels: undefined,
  };
}

export function useProfileEditorCropper({ user, validateFile, setError }) {
  const [avatarFile, setAvatarFile] = useState();
  const [bannerFile, setBannerFile] = useState();
  const [croppedAvatarPreview, setCroppedAvatarPreview] = useState(() =>
    user.avatar ? toAbsoluteMediaUrl(user.avatar) : undefined
  );
  const [croppedBannerPreview, setCroppedBannerPreview] = useState(() =>
    user.banner ? toAbsoluteMediaUrl(user.banner) : undefined
  );
  const [cropperState, setCropperState] = useState({
    show: false,
    type: undefined,
    image: undefined,
    crop: { x: 0, y: 0 },
    zoom: 1,
    aspect: 1,
    croppedAreaPixels: undefined,
  });

  const updateBlobPreview = useCallback((blob, setPreview) => {
    setPreview((previousPreview) => {
      if (previousPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(previousPreview);
      }

      return URL.createObjectURL(blob);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (croppedAvatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(croppedAvatarPreview);
      }

      if (croppedBannerPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(croppedBannerPreview);
      }
    };
  }, [croppedAvatarPreview, croppedBannerPreview]);

  const openCropper = useCallback(
    (type, file) => {
      const reader = new FileReader();

      reader.onload = () => {
        setCropperState(createCropperState(type, reader.result));
      };

      reader.onerror = () => {
        setError("Не удалось прочитать файл.");
      };

      reader.readAsDataURL(file);
    },
    [setError]
  );

  const onAvatarChange = useCallback(
    (file) => {
      if (!file) {
        return;
      }

      if (!validateFile(file, FILE_LIMITS.AVATAR_MAX_SIZE, "Аватар")) {
        return;
      }

      openCropper("avatar", file);
    },
    [openCropper, validateFile]
  );

  const onBannerChange = useCallback(
    (file) => {
      if (!file) {
        return;
      }

      if (!validateFile(file, FILE_LIMITS.BANNER_MAX_SIZE, "Баннер")) {
        return;
      }

      openCropper("banner", file);
    },
    [openCropper, validateFile]
  );

  const handleCropComplete = useCallback((croppedAreaPixels) => {
    setCropperState((prev) => ({ ...prev, croppedAreaPixels }));
  }, []);

  const handleZoomChange = useCallback((zoom) => {
    setCropperState((prev) => ({ ...prev, zoom }));
  }, []);

  const handleCropChange = useCallback((crop) => {
    setCropperState((prev) => ({ ...prev, crop }));
  }, []);

  const handleCloseCropper = useCallback(() => {
    setCropperState((prev) => ({ ...prev, show: false }));
  }, []);

  const handleApplyCrop = useCallback(async () => {
    try {
      const { type, image, croppedAreaPixels } = cropperState;
      if (!image || !croppedAreaPixels || !type) {
        setError("Недостаточно данных для кадрирования.");
        return;
      }

      const croppedImage = await getCroppedImg(image, croppedAreaPixels);

      if (type === "avatar") {
        setAvatarFile(croppedImage);
        updateBlobPreview(croppedImage, setCroppedAvatarPreview);
      }

      if (type === "banner") {
        setBannerFile(croppedImage);
        updateBlobPreview(croppedImage, setCroppedBannerPreview);
      }

      setCropperState((prev) => ({ ...prev, show: false }));
      setError(undefined);
    } catch (error) {
      console.error("Crop error", error);
      setError("Не удалось обработать изображение.");
    }
  }, [cropperState, setError, updateBlobPreview]);

  return {
    avatarFile,
    bannerFile,
    croppedAvatarPreview,
    croppedBannerPreview,
    cropperState,
    onAvatarChange,
    onBannerChange,
    handleCropComplete,
    handleZoomChange,
    handleCropChange,
    handleCloseCropper,
    handleApplyCrop,
  };
}

export default useProfileEditorCropper;
