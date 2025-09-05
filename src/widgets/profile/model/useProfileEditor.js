import { useState, useEffect, useCallback } from "react";
import { getCroppedImg } from "@utils/imageUtils";
import { FILE_LIMITS, INPUT_LIMITS } from "@constants/appConstants";

export function useProfileEditor({ user, onSave }) {
  const [formData, setFormData] = useState({
    username: user.username || "",
    description: user.description || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [croppedAvatarPreview, setCroppedAvatarPreview] = useState(
    user.avatar ? `${import.meta.env.VITE_API_URL}${user.avatar}` : null
  );
  const [croppedBannerPreview, setCroppedBannerPreview] = useState(
    user.banner ? `${import.meta.env.VITE_API_URL}${user.banner}` : null
  );
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("edit");
  const [cropperState, setCropperState] = useState({
    show: false,
    type: null,
    image: null,
    crop: { x: 0, y: 0 },
    zoom: 1,
    aspect: 1,
    croppedAreaPixels: null,
  });

  // auto clear errors
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleFormChange = useCallback((field, value) => {
    if (
      field === "username" &&
      value.length > INPUT_LIMITS.USERNAME_MAX_LENGTH
    ) {
      setError(
        `Никнейм не может быть длиннее ${INPUT_LIMITS.USERNAME_MAX_LENGTH} символов`
      );
      return;
    }
    if (
      field === "description" &&
      value.length > INPUT_LIMITS.DESCRIPTION_MAX_LENGTH
    ) {
      setError(
        `Описание не может быть длиннее ${INPUT_LIMITS.DESCRIPTION_MAX_LENGTH} символов`
      );
      return;
    }
    setFormData((p) => ({ ...p, [field]: value }));
    setError(null);
  }, []);

  const validateFile = useCallback((file, limit, label) => {
    if (file.size > limit) {
      setError(
        `${label} слишком большой. Максимальный размер: ${
          limit / (1024 * 1024)
        }MB`
      );
      return false;
    }
    const allowed = ["image/jpeg", "image/png", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError(`Неподдерживаемый формат файла для ${label.toLowerCase()}.`);
      return false;
    }
    return true;
  }, []);

  const openCropper = useCallback((type, file) => {
    const reader = new FileReader();
    reader.onload = () =>
      setCropperState({
        show: true,
        type,
        image: reader.result,
        crop: { x: 0, y: 0 },
        zoom: 1,
        aspect: type === "avatar" ? 1 : 4,
        croppedAreaPixels: null,
      });
    reader.onerror = () => setError("Не удалось прочитать файл.");
    reader.readAsDataURL(file);
  }, []);

  const onAvatarChange = useCallback(
    (file) => {
      if (file && validateFile(file, FILE_LIMITS.AVATAR_MAX_SIZE, "Аватар"))
        openCropper("avatar", file);
    },
    [openCropper, validateFile]
  );

  const onBannerChange = useCallback(
    (file) => {
      if (file && validateFile(file, FILE_LIMITS.BANNER_MAX_SIZE, "Баннер"))
        openCropper("banner", file);
    },
    [openCropper, validateFile]
  );

  const handleCropComplete = useCallback(
    (croppedAreaPixels) =>
      setCropperState((p) => ({ ...p, croppedAreaPixels })),
    []
  );
  const handleZoomChange = useCallback(
    (zoom) => setCropperState((p) => ({ ...p, zoom })),
    []
  );
  const handleCropChange = useCallback(
    (crop) => setCropperState((p) => ({ ...p, crop })),
    []
  );
  const handleCloseCropper = useCallback(
    () => setCropperState((p) => ({ ...p, show: false })),
    []
  );

  const handleApplyCrop = useCallback(async () => {
    try {
      const { type, image, croppedAreaPixels } = cropperState;
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      if (type === "avatar") {
        setAvatarFile(croppedImage);
        setCroppedAvatarPreview(URL.createObjectURL(croppedImage));
      } else if (type === "banner") {
        setBannerFile(croppedImage);
        setCroppedBannerPreview(URL.createObjectURL(croppedImage));
      }
      setCropperState((p) => ({ ...p, show: false }));
      setError(null);
    } catch (e) {
      console.error("Crop error", e);
      setError("Не удалось обработать изображение.");
    }
  }, [cropperState]);

  const validateForm = useCallback(() => {
    if (!formData.username.trim()) {
      setError("Никнейм не может быть пустым");
      return false;
    }
    if (formData.username.length > INPUT_LIMITS.USERNAME_MAX_LENGTH) {
      setError(
        `Никнейм не может быть длиннее ${INPUT_LIMITS.USERNAME_MAX_LENGTH} символов`
      );
      return false;
    }
    if (
      formData.description &&
      formData.description.length > INPUT_LIMITS.DESCRIPTION_MAX_LENGTH
    ) {
      setError(
        `Описание не может быть длиннее ${INPUT_LIMITS.DESCRIPTION_MAX_LENGTH} символов`
      );
      return false;
    }
    return true;
  }, [formData.description, formData.username]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;
    const fd = new FormData();
    fd.append("username", formData.username);
    fd.append("description", formData.description);
    if (avatarFile) fd.append("avatar", avatarFile);
    if (bannerFile) fd.append("banner", bannerFile);
    onSave(fd);
  }, [
    avatarFile,
    bannerFile,
    formData.description,
    formData.username,
    onSave,
    validateForm,
  ]);

  const previewProfile = {
    ...user,
    username: formData.username,
    description: formData.description,
    avatar: croppedAvatarPreview
      ? croppedAvatarPreview.replace(import.meta.env.VITE_API_URL, "")
      : user.avatar,
    banner: croppedBannerPreview
      ? croppedBannerPreview.replace(import.meta.env.VITE_API_URL, "")
      : user.banner,
    status: user.status,
    createdAt: user.createdAt,
    email: user.email,
  };

  return {
    // data
    formData,
    croppedAvatarPreview,
    croppedBannerPreview,
    previewProfile,
    error,
    activeTab,
    cropperState,
    // setters & controls
    setActiveTab,
    handleFormChange,
    onAvatarChange,
    onBannerChange,
    handleSubmit,
    // crop controls
    handleCropComplete,
    handleZoomChange,
    handleCropChange,
    handleCloseCropper,
    handleApplyCrop,
  };
}

export default useProfileEditor;
