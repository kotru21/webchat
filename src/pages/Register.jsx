import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { register } from "@features/auth/api/authApi";
import { notifyError, notifySuccess } from "@features/notifications/notify";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";

const EMAIL_PATTERN = /\S+@\S+\.\S+/;
const PASSWORD_PATTERN =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const USERNAME_PATTERN = /^[\p{L}\p{N}_.-]+$/u;
const PASSWORD_HINT =
  "От 8 символов: заглавная и строчная буква, цифра и спецсимвол";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    clearFieldError("avatar");
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors((prev) => ({
          ...prev,
          avatar: "Размер файла не должен превышать 5MB",
        }));
        notifyError("Размер файла не должен превышать 5MB");
        e.target.value = "";
        return;
      }
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    const normalizedEmail = email.trim();
    const normalizedUsername = username.trim();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = "Введите корректный email";
    }

    if (!PASSWORD_PATTERN.test(password)) {
      nextErrors.password = PASSWORD_HINT;
    }

    if (
      normalizedUsername &&
      (normalizedUsername.length < 2 ||
        normalizedUsername.length > 30 ||
        !USERNAME_PATTERN.test(normalizedUsername))
    ) {
      nextErrors.username =
        "Никнейм: 2–30 символов, только буквы, цифры, _, . и -";
    }

    setFieldErrors(nextErrors);
    const firstError = Object.values(nextErrors)[0];
    if (firstError) {
      notifyError(firstError);
      return null;
    }

    return { normalizedEmail, normalizedUsername };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validated = validateForm();
    if (!validated) return;

    setLoading(true);
    const { normalizedEmail, normalizedUsername } = validated;

    const formData = new FormData();
    formData.append("email", normalizedEmail);
    formData.append("password", password);
    formData.append(
      "username",
      normalizedUsername || normalizedEmail.split("@")[0]
    );
    if (avatar) {
      formData.append("avatar", avatar);
    }

    try {
      await register(formData);
      notifySuccess("Регистрация прошла успешно");
      navigate("/login");
    } catch (error) {
      const validationError = error.response?.data?.errors?.[0]?.msg;
      const backendMessage = error.response?.data?.message;
      const message =
        validationError || backendMessage || "Ошибка регистрации";
      notifyError(message);

      const lower = String(message).toLowerCase();
      if (lower.includes("email")) {
        setFieldErrors((prev) => ({ ...prev, email: message }));
      } else if (lower.includes("парол") || lower.includes("password")) {
        setFieldErrors((prev) => ({ ...prev, password: message }));
      } else if (lower.includes("ник") || lower.includes("username")) {
        setFieldErrors((prev) => ({ ...prev, username: message }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -right-16 top-4 h-72 w-72 rounded-full bg-primary/14 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <Card className="w-full max-w-lg border-border/70 bg-card/92 backdrop-blur-xl m3-elev-2">
          <CardHeader className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Secure Chat Lab
            </p>
            <CardTitle className="text-3xl font-heading">
              Создать аккаунт
            </CardTitle>
            <CardDescription>
              Профиль для приватных DM. Медиа доступны только участникам диалога
              через авторизованный API.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="flex h-24 items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Предпросмотр аватара"
                    className="h-24 w-24 rounded-full object-cover ring-2 ring-primary/30"
                  />
                ) : (
                  <div className="m3-surface-high flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-border/80 text-xs text-muted-foreground">
                    Аватар
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="avatar">Аватар (опционально)</Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  aria-invalid={Boolean(fieldErrors.avatar)}
                  aria-describedby={
                    fieldErrors.avatar ? "avatar-error" : "avatar-hint"
                  }
                  className="cursor-pointer file:cursor-pointer"
                />
                <p id="avatar-hint" className="text-xs text-muted-foreground">
                  Максимальный размер: 5MB. Форматы: JPEG, PNG, GIF
                </p>
                {fieldErrors.avatar ? (
                  <p
                    id="avatar-error"
                    role="alert"
                    className="text-sm text-destructive">
                    {fieldErrors.avatar}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="username">Никнейм (необязательно)</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Например, andrey_dev"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearFieldError("username");
                  }}
                  aria-invalid={Boolean(fieldErrors.username)}
                  aria-describedby={
                    fieldErrors.username ? "username-error" : undefined
                  }
                  className={
                    fieldErrors.username
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : ""
                  }
                />
                {fieldErrors.username ? (
                  <p
                    id="username-error"
                    role="alert"
                    className="text-sm text-destructive">
                    {fieldErrors.username}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "email-error" : undefined
                  }
                  className={
                    fieldErrors.email
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : ""
                  }
                />
                {fieldErrors.email ? (
                  <p
                    id="email-error"
                    role="alert"
                    className="text-sm text-destructive">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Минимум 8 символов"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password
                      ? "password-error"
                      : "password-hint"
                  }
                  className={
                    fieldErrors.password
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : ""
                  }
                />
                <p id="password-hint" className="text-xs text-muted-foreground">
                  {PASSWORD_HINT}
                </p>
                {fieldErrors.password ? (
                  <p
                    id="password-error"
                    role="alert"
                    className="text-sm text-destructive">
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                className="h-11 w-full text-sm"
                disabled={loading}
                aria-busy={loading}>
                {loading ? "Регистрация..." : "Зарегистрироваться"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-3 text-sm text-muted-foreground">
            <p className="text-center text-xs leading-5">
              Пароль хранится как bcrypt-хэш. Это lab-окружение: без email-verify
              и без E2EE.
            </p>
            <div className="text-center">
              Уже есть аккаунт?
              <RouterLink
                to="/login"
                className="ml-1.5 cursor-pointer font-medium text-primary underline-offset-4 hover:underline">
                Войти
              </RouterLink>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
