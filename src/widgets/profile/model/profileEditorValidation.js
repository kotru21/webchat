import { INPUT_LIMITS } from "@constants/appConstants";

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];

export function getProfileFieldLengthError(field, value) {
  if (field === "username" && value.length > INPUT_LIMITS.USERNAME_MAX_LENGTH) {
    return `Никнейм не может быть длиннее ${INPUT_LIMITS.USERNAME_MAX_LENGTH} символов`;
  }

  if (
    field === "description" &&
    value.length > INPUT_LIMITS.DESCRIPTION_MAX_LENGTH
  ) {
    return `Описание не может быть длиннее ${INPUT_LIMITS.DESCRIPTION_MAX_LENGTH} символов`;
  }

  return undefined;
}

export function validateProfileImageFile(file, limit, label) {
  if (file.size > limit) {
    return `${label} слишком большой. Максимальный размер: ${
      limit / (1024 * 1024)
    }MB`;
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return `Неподдерживаемый формат файла для ${label.toLowerCase()}.`;
  }

  return undefined;
}

export function validateProfileFormData(formData) {
  if (!formData.username.trim()) {
    return "Никнейм не может быть пустым";
  }

  const usernameError = getProfileFieldLengthError("username", formData.username);
  if (usernameError) {
    return usernameError;
  }

  const descriptionError = getProfileFieldLengthError(
    "description",
    formData.description || ""
  );
  if (descriptionError) {
    return descriptionError;
  }

  return undefined;
}
