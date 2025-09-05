import { useReducer, useEffect, useState } from "react";
import { USER_STATUSES } from "../constants/statusConstants";
import { updateStatus as setStatus } from "@features/status/api/statusApi";
import { authReducer, normalizeUser } from "@features/auth/model/authState";
import apiClient from "@shared/api/client";
import { AuthContext } from "./AuthContextBase";
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
  });

  const [userStatus, setUserStatus] = useState(state.user?.status || "offline");

  // Загрузка данных из localStorage при старте
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const normalizedUser = normalizeUser(parsedUser);
        dispatch({ type: "LOGIN", payload: normalizedUser });
        if (parsedUser.status) {
          setUserStatus(parsedUser.status);
        }
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
  const login = async (userData, token) => {
    const normalizedUser = normalizeUser(userData);
    dispatch({ type: "LOGIN", payload: normalizedUser });
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    // Устанавливаем статус при входе
    try {
      await setStatus(USER_STATUSES.ONLINE);
      setUserStatus(USER_STATUSES.ONLINE);
    } catch (error) {
      console.error("Ошибка при установке статуса online:", error);
    }
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
      // Устанавливаем статус offline перед выходом
      await setStatus(USER_STATUSES.OFFLINE);

      // Выполняем выход на сервере
      await apiClient.post("/api/auth/logout");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    } finally {
      // Всегда выполняем локальный выход
      dispatch({ type: "LOGOUT" });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  // Обработчик изменения статуса
  const handleStatusChange = async (newStatus) => {
    try {
      await setStatus(newStatus);
      setUserStatus(newStatus);

      // Обновляем пользователя
      dispatch({
        type: "UPDATE_PROFILE",
        payload: { status: newStatus },
      });
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
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
        userStatus,
        handleStatusChange,
      }}>
      {!state.loading && children}
    </AuthContext.Provider>
  );
};

// useAuth вынесен в отдельный файл @context/useAuth для корректного Fast Refresh.
