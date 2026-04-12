import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getProfileFieldLengthError,
  validateProfileFormData,
  validateProfileImageFile,
} from "./profileEditorValidation";
import { useProfileEditorCropper } from "./useProfileEditorCropper";

export function useProfileEditor({ user, onSave }) {
  const [formData, setFormData] = useState({
    username: user.username || "",
    description: user.description || "",
  });
  const [error, setError] = useState();
  const [activeTab, setActiveTab] = useState("edit");

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(undefined), 5000);
      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [error]);

  const handleFormChange = useCallback((field, value) => {
    const fieldError = getProfileFieldLengthError(field, value);

    if (fieldError) {
      setError(fieldError);
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(undefined);
  }, []);

  const validateFile = useCallback((file, limit, label) => {
    const fileError = validateProfileImageFile(file, limit, label);

    if (fileError) {
      setError(fileError);
      return false;
    }

    return true;
  }, []);

  const {
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
  } = useProfileEditorCropper({ user, validateFile, setError });

  const handleSubmit = useCallback(() => {
    const formError = validateProfileFormData(formData);

    if (formError) {
      setError(formError);
      return;
    }

    const payload = new FormData();
    payload.append("username", formData.username);
    payload.append("description", formData.description);

    if (avatarFile) {
      payload.append("avatar", avatarFile);
    }

    if (bannerFile) {
      payload.append("banner", bannerFile);
    }

    onSave(payload);
  }, [avatarFile, bannerFile, formData, onSave]);

  const previewProfile = useMemo(
    () => ({
      ...user,
      username: formData.username,
      description: formData.description,
      avatar: croppedAvatarPreview || user.avatar,
      banner: croppedBannerPreview || user.banner,
      createdAt: user.createdAt,
      email: user.email,
    }),
    [
      croppedAvatarPreview,
      croppedBannerPreview,
      formData.description,
      formData.username,
      user,
    ]
  );

  return {
    formData,
    croppedAvatarPreview,
    croppedBannerPreview,
    previewProfile,
    error,
    activeTab,
    cropperState,
    setActiveTab,
    handleFormChange,
    onAvatarChange,
    onBannerChange,
    handleSubmit,
    handleCropComplete,
    handleZoomChange,
    handleCropChange,
    handleCloseCropper,
    handleApplyCrop,
  };
}

export default useProfileEditor;
