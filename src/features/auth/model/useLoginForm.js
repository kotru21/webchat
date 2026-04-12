import { useCallback, useState } from "react";
import { login } from "@features/auth/api/authApi";
import { notifyError, notifySuccess } from "@features/notifications/notify";

const EMAIL_PATTERN = /\S+@\S+\.\S+/;

const getBadRequestDetails = (message) => {
  const normalized = String(message || "").toLowerCase();

  if (normalized.includes("email")) {
    return { fieldErrors: { email: "Некорректный email" } };
  }

  if (normalized.includes("пароль") || normalized.includes("password")) {
    return { fieldErrors: { password: "Некорректный пароль" } };
  }

  return {
    formError: message || "Неверные учетные данные",
  };
};

const resolveLoginError = (error) => {
  if (error?.response) {
    const status = error.response.status;
    const backendMessage = error.response.data?.message;

    if (status === 400) {
      return getBadRequestDetails(backendMessage);
    }

    if (status === 401) {
      return { formError: "Неверный email или пароль" };
    }

    if (status === 429) {
      return {
        formError: "Слишком много попыток входа. Пожалуйста, попробуйте позже",
      };
    }

    if (status === 500) {
      return { formError: "Ошибка сервера. Пожалуйста, попробуйте позже" };
    }

    return { formError: backendMessage || "Ошибка при входе" };
  }

  if (error?.request) {
    return { formError: "Сервер недоступен. Проверьте подключение к интернету" };
  }

  return { formError: "Ошибка при входе. Пожалуйста, попробуйте позже" };
};

export function useLoginForm({ onAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const getFirstFieldError = useCallback((errors) => {
    return Object.values(errors).find(Boolean);
  }, []);

  const handleEmailChange = useCallback((value) => {
    setEmail(value);
    setFieldErrors((prev) => ({ ...prev, email: undefined }));
  }, []);

  const handlePasswordChange = useCallback((value) => {
    setPassword(value);
    setFieldErrors((prev) => ({ ...prev, password: undefined }));
  }, []);

  const validateForm = useCallback(() => {
    const nextErrors = {};

    if (!email) {
      nextErrors.email = "Email обязателен";
    } else if (!EMAIL_PATTERN.test(email)) {
      nextErrors.email = "Некорректный формат email";
    }

    if (!password) {
      nextErrors.password = "Пароль обязателен";
    }

    setFieldErrors(nextErrors);
    const isValid = Object.keys(nextErrors).length === 0;

    if (!isValid) {
      const message = getFirstFieldError(nextErrors);
      if (message) {
        notifyError(message);
      }
    }

    return isValid;
  }, [email, getFirstFieldError, password]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      setLoading(true);

      try {
        const data = await login(email, password);
        if (data?.token) {
          notifySuccess("Вход выполнен успешно");
          onAuthenticated(data);
          return;
        }

        notifyError("Некорректный ответ от сервера");
      } catch (err) {
        const result = resolveLoginError(err);

        if (result.fieldErrors) {
          setFieldErrors((prev) => ({ ...prev, ...result.fieldErrors }));
        }

        const fallbackFieldError = result.fieldErrors
          ? getFirstFieldError(result.fieldErrors)
          : undefined;

        notifyError(result.formError || fallbackFieldError || "Ошибка при входе");
      } finally {
        setLoading(false);
      }
    },
    [email, getFirstFieldError, onAuthenticated, password, validateForm]
  );

  return {
    email,
    password,
    loading,
    fieldErrors,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
  };
}

export default useLoginForm;
