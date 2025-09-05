import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { login } from "@features/auth/api/authApi";
import { useAuth } from "@context/useAuth";
import { FiAlertCircle } from "react-icons/fi";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  // Сброс ошибок поля при изменении значения
  useEffect(() => {
    if (email) {
      setFieldErrors((prev) => ({ ...prev, email: null }));
    }
  }, [email]);

  useEffect(() => {
    if (password) {
      setFieldErrors((prev) => ({ ...prev, password: null }));
    }
  }, [password]);

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!email) {
      errors.email = "Email обязателен";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Некорректный формат email";
      isValid = false;
    }

    if (!password) {
      errors.password = "Пароль обязателен";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Валидация формы
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const data = await login(email, password);
      if (data && data.token) {
        authLogin(data, data.token);
        navigate("/");
      } else {
        setError("Некорректный ответ от сервера");
      }
    } catch (error) {
      console.error("Login error:", error);

      // Более информативные сообщения об ошибках
      if (error.response) {
        switch (error.response.status) {
          case 400:
            if (
              error.response.data?.message?.includes("email") ||
              error.response.data?.message?.includes("Email")
            ) {
              setFieldErrors((prev) => ({
                ...prev,
                email: "Некорректный email",
              }));
            } else if (
              error.response.data?.message?.includes("пароль") ||
              error.response.data?.message?.includes("Пароль")
            ) {
              setFieldErrors((prev) => ({
                ...prev,
                password: "Некорректный пароль",
              }));
            } else {
              setError(
                error.response.data?.message || "Неверные учетные данные"
              );
            }
            break;
          case 401:
            setError("Неверный email или пароль");
            break;
          case 429:
            setError(
              "Слишком много попыток входа. Пожалуйста, попробуйте позже"
            );
            break;
          case 500:
            setError("Ошибка сервера. Пожалуйста, попробуйте позже");
            break;
          default:
            setError(error.response.data?.message || "Ошибка при входе");
        }
      } else if (error.request) {
        setError("Сервер недоступен. Проверьте подключение к интернету");
      } else {
        setError("Ошибка при входе. Пожалуйста, попробуйте позже");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Вход в WebChat
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg flex items-center">
              <FiAlertCircle className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="rounded-md -space-y-px">
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  fieldErrors.email
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                } rounded-md placeholder-gray-500 dark:placeholder-gray-400 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Введите email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  fieldErrors.password
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                } rounded-md placeholder-gray-500 dark:placeholder-gray-400 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.password}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}>
              {loading ? "Выполняется вход..." : "Войти"}
            </button>
          </div>

          <div className="flex items-center justify-center mt-4">
            <div className="text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                Нет аккаунта?{" "}
                <RouterLink
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">
                  Зарегистрироваться
                </RouterLink>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
