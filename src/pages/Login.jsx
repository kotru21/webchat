import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Базовая валидация на клиенте
    if (!email || !password) {
      setError("Пожалуйста, заполните все поля");
      setLoading(false);
      return;
    }

    try {
      const data = await login(email, password);
      if (data && data.token) {
        authLogin(data, data.token);
        navigate("/");
      } else {
        setError("Некорректный ответ от сервера");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Ошибка при входе. Пожалуйста, попробуйте позже."
      );
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}>
            {loading ? "Вход..." : "Войти"}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            Нет аккаунта?{" "}
            <RouterLink
              to="/register"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Зарегистрироваться
            </RouterLink>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
