import { useReducer, useEffect } from "react";
import { authReducer, normalizeUser } from "@features/auth/model/authState";
import apiClient from "@shared/api/client";
import { AuthContext } from "./AuthContextBase";
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
  });

  // Загрузка данных из localStorage при старте
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const normalizedUser = normalizeUser(parsedUser);
        dispatch({ type: "LOGIN", payload: normalizedUser });
      } catch (error) {
        console.error("Ошибка парсинга данных из localStorage:", error);
        localStorage.removeItem("user");
        dispatch({ type: "LOGOUT" });
      }
    } else {
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  // Принцип SRP: разделение ответственности для аутентификации
  const login = async (userData, token, refreshToken) => {
    const normalizedUser = normalizeUser(userData);
    dispatch({ type: "LOGIN", payload: normalizedUser });
    localStorage.setItem("token", token);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  // Обновление профиля
  const updateUser = (updatedUser) => {
    const normalizedUser = normalizeUser(updatedUser);
    dispatch({ type: "UPDATE_PROFILE", payload: normalizedUser });
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  };

  // Выход из системы
  const logout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    } finally {
      // Всегда выполняем локальный выход
      dispatch({ type: "LOGOUT" });
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        login,
        logout,
        updateUser,
        loading: state.loading,
      }}>
      {!state.loading && children}
    </AuthContext.Provider>
  );
};

// useAuth вынесен в отдельный файл @context/useAuth для корректного Fast Refresh.
