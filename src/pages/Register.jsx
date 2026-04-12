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

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const normalizedEmail = email.trim();
    const normalizedUsername = username.trim();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      notifyError("Введите корректный email");
      setLoading(false);
      return;
    }

    if (!PASSWORD_PATTERN.test(password)) {
      notifyError(
        "Пароль должен быть от 8 символов и содержать заглавные и строчные буквы, цифру и спецсимвол"
      );
      setLoading(false);
      return;
    }

    if (
      normalizedUsername &&
      (normalizedUsername.length < 2 ||
        normalizedUsername.length > 30 ||
        !USERNAME_PATTERN.test(normalizedUsername))
    ) {
      notifyError(
        "Никнейм должен содержать от 2 до 30 символов и включать только буквы, цифры, _, . и -"
      );
      setLoading(false);
      return;
    }

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
      notifyError(validationError || backendMessage || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 top-4 h-72 w-72 rounded-full bg-primary/14 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <Card className="w-full max-w-lg border-border/70 bg-card/92 backdrop-blur-xl m3-elev-2">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl">Создать аккаунт</CardTitle>
            <CardDescription>
              Заполните данные профиля, чтобы войти в пространство WebChat.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="flex h-24 items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
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
                  className="cursor-pointer file:cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Максимальный размер: 5MB. Форматы: JPEG, PNG, GIF
                </p>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="username">Никнейм (необязательно)</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Например, andrey_dev"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Минимум 8 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="h-11 w-full text-sm" disabled={loading}>
                {loading ? "Регистрация..." : "Зарегистрироваться"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center text-sm text-muted-foreground">
            Уже есть аккаунт?
            <RouterLink
              to="/login"
              className="ml-1.5 font-medium text-primary underline-offset-4 hover:underline">
              Войти
            </RouterLink>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
